
import os
import json
import time
from threading import Event
from flask import Flask,request, Response

import PyPredict
from PyPredict import ML,QuantumManager,Statistics,API_Interface,np, filesystem, pd
from datetime import datetime, timedelta
#CPython
from CPy_Lib import ReadJSON, CStats, Normalization

app_dir = os.getcwd()
app=Flask(__name__)

#load whats already downloaded
DH_Object = API_Interface.DataHandler()
DH_Object.DownloadTickerData(
    DH_Object.OnHand,
    None,
    None,
    None
)

LiveStopSignal = Event()

metrics_dispatcher = {
    "Mean": CStats.Mean,
    "Mode": CStats.Mode,
    "Median": CStats.Median,
    "Variance": CStats.Variance,
    "STD": CStats.STD,
    "EMA": CStats.EMA,
    "ATR": CStats.ATR,
    "AMA": CStats.AMA
}

#an exception for min max and z score has to be made,
#if min max is called Normalization.FindMinMax has to be called
#if z score is called CStats.Mean and Cstats.STD has to be called

normalization_dispatcher = {
    "Logarithmic":Normalization.Logarithmic,
    "MinMax":Normalization.MinMax,
    "Z_Score":Normalization.Z_Score
}

denormalization_dispatcher = {
    "Logarithmic":Normalization.Logarithmic_Denorm,
    "MinMax":Normalization.MinMax_Denorm,
    "Z_Score":Normalization.Z_Score_Denorm
}

@app.route("/api/SimulateStatus")
def SimulateStatus():
    def generate():
        tempbool=False
        while True:
            time.sleep(4)
            tempbool=not tempbool
            yield f"data: {tempbool}\n\n".encode('utf-8')
    return Response(generate(),content_type='text/event-stream')

@app.route("/api/GetTickers")
def GetTickers():
    DataDirectory=os.getcwd()+f"{filesystem}MarketData"
    Tickers = []
    for filename in [x for x in os.walk(DataDirectory)][0][2]:
        Tickers.append(filename.split("_")[0])
    return{
        "payload":Tickers,
        "error": None
    }

@app.route("/api/DownloadData")
def DownloadData():
    DH_Object.DownloadTickerData(
        [x.replace(" ","") for x in request.args.get("Tickers").split(',')],
        request.args.get("from",type=str).replace(",","-"),
        request.args.get("to",type=str).replace(",","-"),
        request.args.get("interval",type=str)
    )
    return {
        "payload": "Download complete",
        "error": None
    } 

@app.route("/GetNews")
def GetNews():
    Obj = API_Interface.DataHandler()
    tickers = [x.replace(" ","") for x in request.args.get("Tickers").split(',')]
    Articles = []
    for ticker in Obj.GetArticles(tickers):
        Articles.append(ticker["news"])

    return {
        "payload":Articles,
        "error":None
    }

@app.route("/api/FetchJSON",methods=['GET'])
def FetchJSON():
    ticker = f"./MarketData/{request.args.get('ticker')}_data.json"
    JSON_String = ReadJSON.Fetch(ticker)
    Marshalled=json.loads(JSON_String)

    return{ 
        "payload":Marshalled,
        "error":None
    }

@app.route("/MovementAverage",methods=['GET'])
def MovementAverage():
    df = API_Interface.data["FOXO"]
    DMP = (df["high"]-df["low"])/df["open"]*100
    AMP = round(DMP.mean(),2)
    return{
        "payload": f"Average movement price: {AMP}%",
        "error": None
    }

@app.route("/LiveStockFeed")
def LiveStockFeed():
    Ticker = request.args.get("ticker",type=str)
    def Stream():
        while not LiveStopSignal.is_set():
            time.sleep(10)
            Data = DH_Object.GetCurrentPrice(Ticker)
            print(Data)
            yield {
                "payload": Data,
                "error": None
            }
        yield {
            "payload":"Stopped live stock stream",
            "error":None
        }

    return Response(Stream(),content_type='text/event-stream')

@app.route("/LiveFeedSignal",methods=['POST'])
def LiveFeedSignal():
    LiveStopSignal.set()
    return{
        "payload":f"Set live feed signal to {LiveStopSignal}",
        "error":None
    }

@app.route("/api/CreateModel")
def ParentCreateModel():
    Hyperparameters = [int(x) if x.isdigit() else float(x) for x in request.args.get("Hyperparams")[1:-1].split(",")]
    Layer_Arguments = json.loads(request.args.get("LayerArgs"))
    Norm_Method = request.args.get("NormMethod",type=str)
    Ticker = request.args.get("Ticker",type=str)
    Variables = [str(x) for x in request.args.get("Variables")[1:-1].split(",")]
    Model_Obj = ML.Customized_Network(Layer_Arguments,Variables,Hyperparameters[0])
    copy = API_Interface.data[Ticker].copy()
    Means,STDs,Min,Max=[],[],[],[]
    TTV = [Hyperparameters[3],Hyperparameters[4],Hyperparameters[5]]

    to_export = json.loads(API_Interface.data[Ticker][Variables+["timestamp"]].copy().to_json(orient="records"))
    for x in to_export:
        x["colorscheme"] = ["green","red","grey"]

    #Normalize organic data before generating synthetic timestamps
    if Norm_Method=="Z_Score":
        for column in Variables:
            listcol = list(copy[column].tolist())
            Mean = CStats.Mean(listcol)
            STD = CStats.STD(Mean,listcol)
            Means.append(Mean)
            STDs.append(STD)
            copy[column] = normalization_dispatcher[Norm_Method](listcol,Mean,STD)
    
    elif Norm_Method=="MinMax":
        for column in Variables:
            listcol = list(copy[column].tolist())
            tempmin = min(listcol)
            tempmax = max(listcol)
            Min.append(tempmin)
            Max.append(tempmax)
            copy[column] = normalization_dispatcher[Norm_Method](listcol,tempmin,tempmax)
    
    else:
        for column in Variables:
            copy[column] = normalization_dispatcher[Norm_Method](list(copy[column].tolist()))

    MVR = ML.Window(copy,Variables,Hyperparameters[1])
    MVR = ML.Split(MVR[0],MVR[1],TTV)

    #generate synthetic data points through N timesteps 
    TimeOrigin = datetime.fromtimestamp(to_export[-1]["timestamp"]/1000)
    GeneratedTime = [TimeOrigin + timedelta(days=i) for i in range(Hyperparameters[-1])]
    N = len(copy["timestamp"])
    for I in range(0,Hyperparameters[-1]):
        copy.loc[N+I] = [GeneratedTime[I]] + [copy.loc[N-I-1][var] for var in Variables+["timestamp"]]
    prediction_x,_=ML.Window(copy,Variables,Hyperparameters[1])
    prediction_x = prediction_x[len(prediction_x)-Hyperparameters[-1]:len(prediction_x)]
    print(prediction_x)
    
    train_x, train_y = MVR[0]
    test_x, test_y = MVR[1]
    validation_x, validation_y = MVR[2]
    Model = ML.Custom_Network_Model((train_x,test_x,validation_x),(train_y,test_y,validation_y),Hyperparameters[0],int(Hyperparameters[2]),0.1,Model_Obj)
    Model.train()
    Variables.append("timestamp")
    from torch import tensor
    Prediction = Model.predict(prediction_x)
    DeNormalizedPrediction = {}
    
    if Norm_Method=="Z_Score":
        for i,key in zip(range(len(Prediction)),Variables):
            DeNormalizedPrediction[key]=denormalization_dispatcher[Norm_Method](list(Prediction[i]),Means[i],STDs[i])

    elif Norm_Method=="MinMax":
        for i,key in zip(range(len(Prediction)),Variables):
            DeNormalizedPrediction[key] = denormalization_dispatcher[Norm_Method](Prediction[i],Min[i],Max[i])

    else:
        for key in Variables:
            DeNormalizedPrediction[key] = denormalization_dispatcher[Norm_Method](Prediction[i])

    DeNormalizedPrediction["timestamp"] = GeneratedTime
    DeNormalizedPrediction = [dict(zip(DeNormalizedPrediction.keys(), values)) for values in zip(*DeNormalizedPrediction.values())]
    for x in DeNormalizedPrediction:
        x["colorscheme"] = ["rgb(52,235,137)","rgb(207,60,87)","grey"]

    Payload={
        "Prediction":to_export+DeNormalizedPrediction,
        "Loss":[Model.Train_Loss,Model.Test_Loss],
        "Accuracy": [Model.Test_Accuracy,Model.Train_Accuracy]
    }

    return{
        "payload":Payload,
        "error":None
    }
   

@app.route("/VolatilityScore")
def PriceVolatility():
    ticker = "NVDA"
    variable = "high"
    df = API_Interface.data[ticker]
    RT = []
    N = len(df[variable])
    for t in range(1,N):
        RT.append(((df[variable][t]-df[variable][t-1])/df[variable][t-1])*100)
    R=sum(RT)/N
    STD = np.sqrt(sum([(x-R)**2 for x in RT])/N-1)*np.sqrt(252)
    return{
        "payload":f"{ticker} {variable} price volatility score {round(STD)}%",
        "error":None
    }

@app.route("/Train_Univar",methods=['GET'])
def TrainUniVar():

    method = request.args.get("NormMethod",type=str)
    ticker = request.args.get("ticker",type=str)
    #variable = request.args.get("variable",type=str)
    method = normalization_dispatcher[method]
    Normalized = method(list(API_Interface.data[ticker]["open"]))

    Splitter = ML.LSTM_Prep(
        ratio=PyPredict.args["Train-Test-Validation-Split"],
        time_shift=PyPredict.args["Time_Shift"],
        label_size=PyPredict.args["Label_Size"]
    )

    Split_Data = Splitter.split(Normalized)

    Windowed_Data = Splitter.window(Split_Data)

    LSTM = ML.Univariate_LSTM(
        X=Windowed_Data[0],
        Y=Windowed_Data[1],
        cell_count=PyPredict.args["Cell_Count"],
        output_size=PyPredict.args["LSTM_Output_Size"],
        layers=PyPredict.args["Layers"],
        filename=f"{PyPredict.args['Targeted_Ticker']}_univariate.pt",
        MTO=True if PyPredict.args["LSTM_Output_Size"]==1 else False,
        Multivariate=False,
        variable_count=None
    )
    
    LSTM.train()
    predicted = LSTM.predict(Windowed_Data[0][2])
    result = Normalization.DenormLogarithm(predicted)
    return {
        "payload": result,
        "error": None
    }

@app.route("/api/OHLC_Multivariate")
def TestMVWindow():
    Norm_Method = request.args.get("NormMethod",type=str)
    ticker = request.args.get("Ticker",type=str)
    hyperparameters = json.loads(request.args.get("hyperparameters",type=str))

    test_ratio = float(hyperparameters[5]["value"])
    train_ratio = float(hyperparameters[4]["value"])
    validation_ratio = float(hyperparameters[6]["value"])
    TTV = (train_ratio,test_ratio,validation_ratio)

    batch_size = int(hyperparameters[1]["value"])
    window_size = int(hyperparameters[2]["value"])
    cell_count = int(hyperparameters[3]["value"])
    epochs = int(hyperparameters[0]["value"])
    #future = hyperparameters["Window Size"]

    df = API_Interface.data[ticker]
    copy = df.copy()

    Means = []
    STDs = []
    Min = []
    Max = []
    if Norm_Method=="Z_Score":
        for column in ["open","high","low","close"]:
            listcol = list(copy[column].tolist())
            Mean = CStats.Mean(listcol)
            STD = CStats.STD(Mean,listcol)
            Means.append(Mean)
            STDs.append(STD)
            copy[column] = normalization_dispatcher[Norm_Method](listcol,Mean,STD)
    
    elif Norm_Method=="MinMax":
        for column in ["open","high","low","close"]:
            listcol = list(copy[column].tolist())
            tempmin = min(listcol)
            tempmax = max(listcol)
            Min.append(tempmin)
            Max.append(tempmax)
            copy[column] = normalization_dispatcher[Norm_Method](listcol,tempmin,tempmax)
    
    else:
        for column in ["open","high","low","close"]:
            copy[column] = normalization_dispatcher[Norm_Method](list(df[column].tolist()))
    MVR = ML.Window(copy,["open","high","low","close"],window_size)
    MVR = ML.Split(MVR[0],MVR[1],TTV)

    train_x, train_y = MVR[0]
    test_x, test_y = MVR[1]
    validation_x, validation_y = MVR[2]

    Model = ML.LSTM_OHLC_Multivariate((train_x,test_x,validation_x),(train_y,test_y,validation_y),cell_count=cell_count,layers=1,batch_size=batch_size,epochs=epochs,learning_rate=0.1)
    Model.train()
    Prediction = Model.predict(validation_x)

    DeNormalizer = denormalization_dispatcher[Norm_Method]
    OHLC_Prediction = []
    PredictionData = []
    if Norm_Method=="Z_Score":
        for i in range(4):
            DeNormalized = DeNormalizer(list(Prediction[:][i]),Means[i],STDs[i])
            DeNormalized = [round(x,2) for x in DeNormalized]
            OHLC_Prediction.append(DeNormalized)
    elif Norm_Method=="MinMax":
        for i in range(4):
            DeNormalized = DeNormalizer(list(Prediction[:][i]),Min[i],Max[i])
            DeNormalized = [round(x,2) for x in DeNormalized]
            OHLC_Prediction.append(DeNormalized)
    else:
        for i in range(4):
            DeNormalized = DeNormalizer(list(Prediction[:][i]))
            DeNormalized = [round(x,2) for x in DeNormalized]
            OHLC_Prediction.append(DeNormalized)

    JSON_String = ReadJSON.Fetch(f"./MarketData/{ticker}_data.json")
    Marshalled=json.loads(JSON_String)
    CopiedMarshalled = Marshalled
    for x,index in zip(Marshalled,range(len(Marshalled))):
        CopiedMarshalled[index] = {
            "open":x["open"],
            "high":x["high"],
            "low":x["low"],
            "close":x["close"],
            "timestamp":x["timestamp"],
            "volume":x["volume"],
            "colorscheme":["red","green","gray"]
        }

    for x in range(0,len(OHLC_Prediction[0])):
        PredictionData.append(
            {
                'open':OHLC_Prediction[0][x],
                "high":OHLC_Prediction[1][x],
                'low':OHLC_Prediction[2][x],
                "close":OHLC_Prediction[3][x],
                "timestamp":x,
                "volme":x,
                "colorscheme":["magenta","cyan","white"]
            }
        )

    return {
        "payload": CopiedMarshalled+PredictionData,
        "error": None
    }
    

@app.route("/Run_QASM",methods=['GET'])
def Run_QASM():
    results = QuantumManager.RunCircuit(
        None,
        True,
        True,
        request.args.get("Script")
    )
    return{
        "payload": results,
        "error": None
    }

@app.route("/Grovers",methods=['GET'])
def Grovers():
    qubits=request.args.get("qubits",type=int)
    algo=QuantumManager.Grovers_Algorithm(qubits)
    results = algo.Call()
    return{
        "payload":results,
        "error":None
    }

@app.route("/QAE",methods=['GET'])
def QAE():
    qubits = request.args.get("qubits",type=int)
    typeof_qae = request.args.get("typeof",type=str)
    probability = request.args.get('probability',type=float)
    algo = QuantumManager.QAE(qubits)
    print(algo.Qubits)
    results = algo.Call(probability,typeof_qae)
    return {
        "payload": results,
        "error": None
    }

@app.route("/FIP",methods=['GET'])
def FIP():
    high = eval(request.args.get("high"))
    low = eval(request.args.get("low"))
    cf = eval(request.args.get("cf"))
    epsilon=request.args.get("epsilon",type=float)
    alpha=request.args.get("alpha",type=float)
    algo = QuantumManager.Fixed_Income_Pricing(low,high,cf,epsilon,alpha)
    results=algo.Call()
    return{
        "payload":results,
        "error":None
    }

@app.route("/Run_ARIMA",methods=['GET'])
def Run_ARIMA():
    order = eval(request.args.get("order"))
    seasonal_order = eval(request.args.get("seasonal_order",type=str))
    trend = request.args.get("trend")
    enforce_stationarity = request.args.get("enforce_stationarity",type=bool)
    enforce_invertibility = request.args.get("enforce_invertibility",type=bool)
    concentrate_scale = request.args.get("concentrate_scale",type=bool)
    trend_offset = request.args.get("trend_offset",type=int)
    validate_specification = request.args.get("validate_specification",type=bool)
    missing = request.args.get("missing")
    frequency = request.args.get("frequency")
    ticker = request.args.get("ticker",type=str)#add dropdown
    dependent_variable=request.args.get("dependent",type=str)#add dropdown
    independent_variable = request.args.get("independent",type=str)#add dropdown
    independent_set = API_Interface.data[ticker][independent_variable]
    dependent_set = API_Interface.data[ticker][dependent_variable]


    obj = Statistics.Regression_Models(dependent_set,independent_set)
    result = obj.ARIMA(
        order,
        seasonal_order,
        trend,
        enforce_stationarity,
        enforce_invertibility,
        concentrate_scale,
        trend_offset,
        validate_specification,
        missing,
        frequency
    )

    return {
        "payload": "\n\n"+str(result.summary()),
        "error": None
    }

@app.route("/Run_Theta",methods=['GET'])
def Run_Theta():
    period=request.args.get("period",type=str)
    deseasonalize=request.args.get("deseasonalize",type=bool)
    toforecast = request.args.get("toforecast",type=int)#add to react
    use_test=request.args.get("use_test",type=bool)
    method=request.args.get("method",type=str)
    difference=request.args.get("difference",type=bool)
    ticker = request.args.get("ticker",type=str)#add dropdown
    dependent = request.args.get("dependent",type=str)
    independent = request.args.get("independent",type=str)

    dependent_set = API_Interface.data[ticker][dependent]
    independent_set = API_Interface.data[ticker][independent]

    obj = Statistics.Regression_Models(dependent_set,independent_set)

    result = obj.Theta(
        period=period if period=="None" else int(period),
        future_steps=toforecast,
        deseasonalize=deseasonalize,
        use_test=use_test,
        method=method,
        difference=difference
        )

    return {
        "payload": "\n\n"+str(result.summary()),
        "error": None
    }

@app.route("/Run_OLS",methods=['GET'])
def Run_OLS():
    ticker = request.args.get("ticker",type=str)#add dropdown
    dependent_variable=request.args.get("dependent",type=str)#add dropdown
    independent_variable = request.args.get("independent",type=str)#add dropdown
    missing = request.args.get("missing",type=str)
    hasconst = request.args.get("hasconst")

    independent_set = API_Interface.data[ticker][independent_variable]
    dependent_set = API_Interface.data[ticker][dependent_variable]

    obj = Statistics.Regression_Models(dependent_set,independent_set)

    result = obj.Ordinary_least_squares(missing,hasconst)

    return {
        "payload": "\n\n"+result.as_text(),
        "error": None
    }

@app.route("/Run_ClassicLR",methods=['GET'])
def RunClassicLR():
    ticker= request.args.get("ticker",type=str)
    dependent_variable=request.args.get("dependent",type=str)
    independent_variable = request.args.get("independent",type=str)
    independent_set = API_Interface.data[ticker][independent_variable]
    dependent_set = API_Interface.data[ticker][dependent_variable]

    obj = Statistics.Regression_Models(dependent_set,independent_set)
    result = obj.quick_regression()
    return {
        "payload":"\n\n"+str(result),
        "error":None
    }

@app.route("/FetchMetric",methods=['GET'])
def FetchMetric():
    method = request.args.get("method",type=str)
    ticker = request.args.get("ticker",type=str)
    variable = request.args.get("variable",type=str)

    dataset = API_Interface.data[ticker][variable]

    result = metrics_dispatcher[method](dataset)

    return {
        "payload": result,
        "error": None
    }

if __name__=="__main__":
    app.run(debug=True, threaded=True)