from . import torch,np,pd
import statsmodels

device = (
    "cuda"#NVIDIA GPU
    if torch.cuda.is_available()
    else "mps"#AMD GPU
    if torch.backends.mps.is_available()
    else "cpu"
)
    
def Window(df,Variables,window_size=5):
    Windowed_Set, Labels = [], []
    for i in range(len(df[Variables[0]])-window_size):
        Windowed_Set.append(df[Variables].iloc[i:i+window_size].values)
        Labels.append(df[Variables].iloc[i+window_size].values)
    return np.array(Windowed_Set,dtype=np.float32),np.array(Labels,dtype=np.float32)

def Split(Windows,Labels,ratio):
    train_end = int(len(Windows)*ratio[0])
    test_end = train_end + int(len(Windows)*ratio[1])
    validation_end = test_end + int(len(Windows)*ratio[2])

    window_train, label_train = Windows[:train_end],Labels[:train_end]
    window_test, label_test = Windows[train_end:test_end],Labels[train_end:test_end]
    window_validation, label_validation = Windows[test_end:validation_end],Labels[test_end:validation_end]

    return [(window_train,label_train),(window_test,label_test),(window_validation,label_validation)]

class Feature_Engineering():
    def __init__(self,
        time_series:pd.DataFrame,
        min:float,
        max:float
        ):
        self.torched_series=torch.Tensor(time_series)
        self.time_series=time_series
        self.min = min
        self.max = max

    def seasonal_decompose(self,period=5):
        return statsmodels.tsa.seasonal.seasonal_decompose(self.time_series,model="additive",period=period)

    def standard_clip(self):
        return torch.clamp(self.torched_series,self.min,self.max)
    
    def MAD(self,threshold):
        median = np.median(self.time_series)
        mad = np.median(abs(self.time_series-median))
        lower_cut = median-threshold*mad
        upper_cut = median+threshold*mad
        return torch.clamp(torch.Tensor(self.time_series),min=lower_cut,max=upper_cut)


class Customized_Network(torch.nn.Module):
    def __init__(self,LayerArgs,Variables,BatchSize):
        self.LayerArgs = LayerArgs
        self.Variables = Variables
        self.BatchSize = BatchSize
        super().__init__()
        self.Layer_Dispatcher = {
            "LSTM Unidirectional": lambda cellcount,previous : torch.nn.LSTM(
                input_size=previous,
                hidden_size=cellcount,
                num_layers=1,
                batch_first=True
            ),
            "Dropout":lambda Pval : torch.nn.Dropout(p=Pval),
            "Dense":lambda cellcount,previous: torch.nn.Linear(
                in_features=previous,
                out_features=cellcount
            )
        }

        self.Model_Architecture = []

        for Layer,Index in zip(self.LayerArgs,range(len(self.LayerArgs))):#dim batch size error
            if Layer == self.LayerArgs[0] and Layer["layer_type"] == "LSTM Unidirectional":
                self.Model_Architecture.append(
                    self.Layer_Dispatcher[Layer["layer_type"]](
                        Layer["cell_count"],
                        self.BatchSize
                    )
                )

            elif Layer != self.LayerArgs[0] and Layer != self.LayerArgs[-1]:
                self.Model_Architecture.append(
                    self.Layer_Dispatcher[Layer["layer_type"]](
                        Layer["cell_count"],
                        self.LayerArgs[Index-1]["cell_count"]
                    )
                )

            elif Layer == self.LayerArgs[-1]:
                self.Model_Architecture.append(
                    self.Layer_Dispatcher[Layer["layer_type"]](
                        len(self.Variables),
                        self.LayerArgs[Index-1]["cell_count"]
                    )
                )

            if Layer["dropout"]>0.00:
                self.Model_Architecture.append(
                    self.Layer_Dispatcher["Dropout"](
                        Layer["dropout"]
                    )
                )
                
        self.Model = torch.nn.Sequential(*self.Model_Architecture)
    def forward(self,x):
        out = x
        lstm_states = []
        N = len(self.Model_Architecture)
        if(N>1):
            for n in range(1,N):
                if isinstance(self.Model_Architecture[n],torch.nn.LSTM):
                    out,h = self.Model_Architecture[n](out)
                    lstm_states.append(h)
                else:
                    out = self.Model_Architecture[n](out)
            return out[:,-1,:],lstm_states
        else:
            if isinstance(self.Model_Architecture[n],torch.nn.LSTM):
                out,h = self.Model_Architecture[0](out)
                lstm_states.append(h)
            else:
                out = self.Model_Architecture[0](out)
            return out[:,-1,:],lstm_states

    
class Custom_Network_Model():
    def __init__(self,X,Y,batch_size,epochs,learning_rate,Model):
        self.batch_size = batch_size
        self.epochs = epochs
        self.learning_rate = learning_rate
        self.Model = Model
        self.Train_Loss = []
        self.Test_Loss = []
        self.Train_Accuracy = []
        self.Test_Accuracy = []

        self.train_x, self.train_y = torch.from_numpy(X[0]), torch.from_numpy(Y[0])
        self.test_x, self.test_y = torch.from_numpy(X[1]), torch.from_numpy(Y[1])

        self.TrainingLoader = torch.utils.data.DataLoader(
            torch.utils.data.TensorDataset(self.train_x,self.train_y),
            batch_size=batch_size,
            shuffle=True,
            drop_last=True
        )
        self.TestingLoader = torch.utils.data.DataLoader(
            torch.utils.data.TensorDataset(self.test_x,self.test_y),
            batch_size=batch_size,
            shuffle=True,
            drop_last=True
        )

        self.Optimizer = torch.optim.Adam(self.Model.parameters(),lr=self.learning_rate)
        self.LossFunction = torch.nn.MSELoss()

    def train(self):
        for epoch in range(self.epochs):
            temptrain = None
            for X_train, Y_train in self.TrainingLoader:
                self.Optimizer.zero_grad()
                outputs,_ = self.Model(X_train)
                loss = self.LossFunction(outputs,Y_train)
                if loss=="nan":
                    print("Loss resulted in nan, something caused unstable gradients, stopping model traning.")
                    exit()
                loss.backward()
                self.Optimizer.step()
                temptrain = Y_train
            self.Train_Loss.append(float(loss))
            self.Train_Accuracy.append((torch.max(outputs,1==temptrain).sum().item())/temptrain.size(0))
            temptest = None
            for X_Test,Y_Test in self.TestingLoader:
                outputs,_ = self.Model(X_Test)
                loss = self.LossFunction(outputs,Y_Test)
                if loss=="nan":
                    print("Loss resulted in nan, something caused unstable gradients, stopping model traning.")
                    exit()
                loss.backward()
                self.Optimizer.step()
                temptest = Y_Test
            self.Test_Loss.append(float(loss))
            self.Test_Accuracy.append((torch.max(outputs,1==temptest).sum().item())/temptest.size(0))
            print(f"epoch - {epoch}\nTraining loss: {self.Test_Loss[epoch]}\tTesting loss: {self.Test_Loss[epoch]}\n----------------------------------\nTraining accuracy: {self.Train_Accuracy[epoch]}\tTesting accuracy: {self.Test_Accuracy[epoch]}")

    def predict(self,x):
        predicted,_ = self.Model(torch.tensor(x))
        predicted = predicted.detach().numpy().transpose()
        return predicted
    
class LSTM_Univariate_Model(torch.nn.Module):
    def __init__(self,cell_count,layers):
        super().__init__()
        self.layers=layers
        self.cell_count=cell_count
        self.LSTM=(torch.nn.LSTM(1,cell_count,layers,batch_first=True))
        self.dropout=torch.nn.Dropout(p=0.5)
        self.linear=torch.nn.Linear(cell_count,4)
    def forward(self,x):
        batch_size = x.shape[0]
        hidden_state_1 = torch.zeros(self.layers, batch_size, self.cell_count, dtype=torch.float32)
        cell_state_1 = torch.zeros(self.layers, batch_size, self.cell_count, dtype=torch.float32)

        hidden_state_1, cell_state_1 = self.LSTM(x,(hidden_state_1,cell_state_1))
        hidden_state_1 = self.dropout(hidden_state_1)
        return self.linear(hidden_state_1)
    
class LSTM_Univariate():
    def __init__(self,X,Y,cell_count,layers,batch_size,epochs):
        self.epochs = epochs

        self.model = LSTM_Univariate_Model(cell_count,layers)
        self.optimizer = torch.optim.Adam(self.model.parameters())
        self.LossFunction = torch.nn.MSELoss()

        self.train_x, self.train_y = torch.from_numpy(X[0]), torch.from_numpy(Y[0])
        self.test_x, self.test_y = torch.from_numpy(X[1]), torch.from_numpy(Y[1])

        self.TrainingLoader = torch.utils.data.DataLoader(
            torch.utils.data.TensorDataset(self.train_x,self.train_y),
            batch_size=batch_size,
            shuffle=True
        )

    def train(self):
        for epoch in range(self.epochs):
            for X_train, Y_train in self.TrainingLoader:
                self.model.train()
                y_predicted = self.model(X_train)
                loss=self.LossFunction(y_predicted, Y_train)
                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()

            print(f"epoch - {epoch}\nRMSE loss: {loss}")

            if epoch%100!=0:
                continue

            self.model.eval()

            with torch.no_grad():
                y_predicted = self.model(torch.tensor(self.train_x))
                train_rmse=(torch.sqrt(self.LossFunction(y_predicted,self.train_y)))
                y_predicted=self.model(self.test_x)
                test_rmse=(torch.sqrt(self.LossFunction(y_predicted,self.test_y)))

            print(f"epoch - {epoch}\nTrain RMSE: {train_rmse}\nTest RMSE: {test_rmse}")
            
    def predict(self,x):
        predicted=self.model(torch.tensor(x))
        return predicted.flatten().tolist()


class LSTM_OHLC_Multivariate_Model(torch.nn.Module):
    def __init__(self,cell_count=32,layers = 1):
        super().__init__()
        self.layers=layers
        self.cell_count=cell_count
        self.LSTM=(torch.nn.LSTM(4,cell_count,layers,batch_first=True))
        self.dropout=torch.nn.Dropout(p=0.2)
        self.Dense=torch.nn.Linear(cell_count,4)
        self.relu = torch.nn.ReLU()

    def forward(self,x):
        batchsize = x.shape[0]
        cell_state_1 = torch.zeros(self.layers,batchsize,self.cell_count)
        hidden_state_1 = torch.zeros(self.layers,batchsize,self.cell_count)
        LSTM_out,(hidden_state_1,cell_state_1) = self.LSTM(x,(hidden_state_1,cell_state_1))
        LSTM_out = self.dropout(LSTM_out)
        LSTM_out = self.relu(LSTM_out)
        Dense_state = self.Dense(LSTM_out)
        Dense_state = self.relu(Dense_state)
        return Dense_state[:,-1,:]

class LSTM_OHLC_Multivariate():
    def __init__(self,X,Y,cell_count=20,layers=1,batch_size=32,epochs=10,learning_rate=0.01):
        self.model = LSTM_OHLC_Multivariate_Model(cell_count=cell_count,layers=layers)
        self.optimizer = torch.optim.Adam(self.model.parameters(),lr=learning_rate)
        self.LossFunction = torch.nn.MSELoss()
        self.epochs=epochs

        self.train_x, self.train_y = torch.from_numpy(X[0]), torch.from_numpy(Y[0])
        self.test_x, self.test_y = torch.from_numpy(X[1]), torch.from_numpy(Y[1])

        self.TrainingLoader = torch.utils.data.DataLoader(
            torch.utils.data.TensorDataset(self.train_x,self.train_y),
            batch_size=batch_size,
            shuffle=True,
            drop_last=True
        )
        self.TestingLoader = torch.utils.data.DataLoader(
            torch.utils.data.TensorDataset(self.test_x,self.test_y),
            batch_size=batch_size,
            shuffle=True,
            drop_last=True
        )

    def train(self):
        for epoch in range(self.epochs):
            for (X_train, Y_train), (X_Test, Y_Test) in zip(self.TrainingLoader,self.TestingLoader):
                self.model.train()
                y_predicted = self.model(X_train)
                loss=self.LossFunction(y_predicted, Y_train)
                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()
            print(f"epoch - {epoch}\nRMSE loss: {loss}")
            if epoch%100!=0:
                continue
            self.model.eval()
            with torch.no_grad():
                y_predicted = self.model(X_train)
                train_rmse=(torch.sqrt(self.LossFunction(y_predicted,Y_train)))
                y_predicted=self.model(X_Test)
                test_rmse=(torch.sqrt(self.LossFunction(y_predicted,Y_Test)))
            print(f"epoch - {epoch}\nTrain RMSE: {train_rmse}\nTest RMSE: {test_rmse}")

    def predict(self,x):
        predicted=self.model(torch.tensor(x))
        return predicted.tolist()

