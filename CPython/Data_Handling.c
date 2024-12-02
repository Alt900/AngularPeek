#include <Python.h>
#include <math.h>

long TrainSize;
long TestSize;
long ValidationSize;

static PyObject *Split(PyObject *self, PyObject *args){
    PyObject *Array;
    double R1,R2,R3;
    if(!PyArg_ParseTuple(args,"Offf",&Array,&R1,&R2,&R3)){
        return NULL;
    }

    Py_ssize_t len = PyList_Size(Array);

    TrainSize = round(len/R1);
    TestSize = round(len/R2);
    ValidationSize = round(len/R3);

    PyObject *TrainSet = PyList_New(TrainSize);
    PyObject *TestSet = PyList_New(TestSize);
    PyObject *ValidationSet = PyList_New(ValidationSize);

    for (Py_ssize_t i = 0; i<TrainSize; i++){
        PyList_SetItem(TrainSet,i,PyList_GetItem(Array, i));
    }
    for (Py_ssize_t i = TrainSize; i<TestSize+TrainSize; i++){
        PyList_SetItem(TestSet,i-TrainSize,PyList_GetItem(Array, i));
    }
    for (Py_ssize_t i = TrainSize+TestSize; i<len; i++){
        PyList_SetItem(ValidationSet,i-TestSize,PyList_GetItem(Array, i));
    }

    PyObject* ReturnTuple = PyTuple_New(3);

    PyTuple_SetItem(ReturnTuple,0,TrainSet);
    PyTuple_SetItem(ReturnTuple,1,TestSet);
    PyTuple_SetItem(ReturnTuple,2,ValidationSet);

    return ReturnTuple;
}

static PyObject *Window(PyObject *self, PyObject *args){
    PyObject *Split_Tuple;
    int Window_Size;
    if(!PyArg_ParseTuple(args,"Oi",&Split_Tuple,&Window_Size)){
        return NULL;
    }

    //label set sizes and index calculation and initialization
    long Train_Label_Size = (TrainSize-Window_Size)+1;
    long Test_Label_Size = (TestSize-Window_Size)+1;
    long Validation_Label_Size = (ValidationSize-Window_Size)+1;

    PyObject* Train_Labels = PyList_New(Train_Label_Size);
    PyObject* Test_Labels = PyList_New(Test_Label_Size);
    PyObject* Validation_Labels = PyList_New(Validation_Label_Size);

    //2D matrix row count calculation and initialization

    PyObject* Train_Windowed = PyList_New(TrainSize-Window_Size+1);
    PyObject* Test_Windowed = PyList_New(TestSize-Window_Size+1);
    PyObject* Validation_Windowed = PyList_New(ValidationSize-Window_Size+1);


    for (Py_ssize_t i = 0; i<2; i++){
        PyObject *CurrentSet = (Split_Tuple,i);
        for (Py_ssize_t n = 0; n<i==0?self->R1:self->R2||i==1?self->R2:self->R3; n++){
            //grab labels
            PyObject* element = PyList_GetItem(CurrentSet,i+(Window_Size-1));
            PyList_SetItem(i==0?Train_Labels:Test_Labels||i==1?Test_Labels:Validation_Labels,i,element);
            //initialize rows
            PyObject *row = PyList_New(Window_Size);
            for(Py_ssize_t z = 0; z<Window_Size; z++){//find calculation for window 
                PyList_SetItem(row,z,PyList_GetItem(CurrentSet,(n+z)+Window_Size-1));//get the windowed elements
            }
            PyList_SetItem(i==0?Train_Windowed:Test_Windowed||i==1?Test_Windowed:Validation_Windowed,n,row);
        }
    }

    PyObject* ReturnTuple = PyTuple_New(3);

    PyTuple_SetItem(ReturnTuple,0,Train_Windowed);
    PyTuple_SetItem(ReturnTuple,1,Test_Windowed);
    PyTuple_SetItem(ReturnTuple,2,Validation_Windowed);

    return ReturnTuple;
}

static PyObject *Multivariate_Window(PyObject *self, PyObject *args){
    PyObject *Split_Tuple;
    int Window_Size;
    int Variables;
    if(!PyArg_ParseTuple(args,"Oii",&Split_Tuple,&Window_Size,&Variables)){
        return NULL;
    }

    int X_1 = PyList_GET_SIZE(PyList_GetItem(Split_Tuple,0));
    int X_2 = PyList_GET_SIZE(PyList_GetItem(Split_Tuple,1));
    int X_3 = PyList_GET_SIZE(PyList_GetItem(Split_Tuple,2));

    double ***Training_Window = (double***)malloc(X_1*sizeof(double**));
    double ***Testing_Window = (double***)malloc(X_2*sizeof(double**));
    double ***Validation_Window = (double***)malloc(X_3*sizeof(double**));

    double ***Training_Labels = (double***)malloc(X_1*sizeof(double**));
    double ***Testing_Labels = (double***)malloc(X_2*sizeof(double**));
    double ***Validation_Labels = (double***)malloc(X_3*sizeof(double**));
}

//create a multivariate split and window function, for split 
//input type will be double**, for window ***double

//prev functions can be adjusted at setitem row z OHLC[n+z+windowsize-1] where
//OHLC is one of 4 passed arrays containing open,high,low,and close split arrays

static PyMethodDef Functions[] = {
    {"Split",Split,METH_VARARGS,""},
    {"Window",Window,METH_VARARGS,""},
    {NULL,NULL,0,NULL}
};

static struct PyModuleDef Data_Handling = {
    PyModuleDef_HEAD_INIT,
    "Data_Handling",
    NULL,
    -1,
    Functions
};

PyMODINIT_FUNC PyInit_Data_Handling(void){
    return PyModule_Create(&Data_Handling);
}