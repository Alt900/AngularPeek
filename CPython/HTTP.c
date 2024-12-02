#include <stdio.h>
#include <string.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <math.h>

#pragma comment(lib,"Ws2_32.lib")
#define PORT "8080"
#define DEFAULT_BUFFER 512

typedef struct {
    char *key;
    int value;
} Entry;

typedef struct {
    Entry **Entries;
    int N;
    int C;
} HashTable;

unsigned long FNV1A_Hashing(const char *key){
    unsigned long hash = 14695981039346656037UL;//offset
    while (*key){//for each byte
        hash ^= (unsigned char)(*key++); //^= bitwise XOR typeconv byte
        hash *= 1099511628211UL; //prime
    }
    return hash;
}

HashTable *Create_Table(int N){
    HashTable *Table = malloc(sizeof(HashTable));
    Table -> N = N;
    Table -> C = 0;
    Table -> Entries = malloc(sizeof(Entry *)*N);
    for(int i = 0; i<N; i++){
        Table -> Entries[i] = NULL;
    }
    return Table;
}

void Insert(HashTable *Table, const char *Key, int Value){
    unsigned long Index = FNV1A_Hashing(Key) % Table -> N;
    while(Table->Entries[Index]!=NULL){
        if(strcmp(Table->Entries[Index]->key,Key)==0){
            Table->Entries[Index]->value=Value;
            return;
        }
        Index = (Index=1)%Table->N;
    }
    Entry *entry = malloc(sizeof(Entry));
    entry->key = strdup(Key);
    entry->value = Value;
    Table->Entries[Index]=entry;
    Table->C++;
}

int Search(HashTable *Table, const char *Key){
    unsigned long Index = FNV1A_Hashing(Key)%Table->N;
    while(Table->Entries[Index]!=NULL){
        if(strcmp(Table->Entries[Index]->key,Key)==0){
            return Table->Entries[Index]->value;
        }
        Index = (Index+1) % Table -> N;
    }
    return -1;
}

void Free_Table(HashTable *Table){
    for (int i = 0; i<Table->N; i++){
        if(Table->Entries[i]!=NULL){
            free(Table->Entries[i]->key);
            free(Table->Entries[i]);
        }
    }
    free(Table->Entries);
    free(Table);
}

void Callback_Request_Python(void *Request){

}

void Callback_Connect_Python(){

}

void Async_Request_Python(void *Request){
    Callback_Request_Python(Request);
}

void Async_Connect_Python(){
    Callback_Connect_Python();
}

int main(void){
    
    char *Routes [] = {
        "/DownloadData",
        "/FetchTickerData",
        "/CreateModel",
        "/Train_Univar",
        "/Multivariate_Prebuilt",
        "/Run_QASM",
        "/Grovers",
        "/QAE",
        "/FIP",
        "/FetchJSON",
        "/Run_ARIMA",
        "/Run_Theta",
        "/Run_OLS",
        "/Run_ClassicLR",
        "/FetchMetric"
    };

    HashTable *Routing_Table = Create_Table(sizeof(Routes));

    int N_Strings = sizeof(Routes)/sizeof(Routes[0]);//logic does not account for dynamic's
    //instead generate []{N/sizeof I}

    for (int i = 0; i<N_Strings; i++){
        Insert(Routing_Table,Routes[i],"Function pointer");
    }


    char *ArgLexTable [] =  {//Terminator will always be I+1 
        '&',//arg terminator
        '[',//list argtype begin
        ']',// list argtype end
        '{',//dict argtype begin
        '}',//dict argtype end
    };

    //create the server on https;//127.0.0.1:8080
    WSADATA wsaData;
    int IResult;

    SOCKET Listen = INVALID_SOCKET;
    SOCKET Client = INVALID_SOCKET;

    struct addrinfo *result = NULL;
    struct addrinfo hints;

    char recvbuf[DEFAULT_BUFFER];

    IResult = WSAStartup(MAKEWORD(2,2),&wsaData);
    if(IResult != 0){
        printf("WSA startup failed; %d\n",IResult);
        return 1;
    }

    ZeroMemory(&hints,sizeof(hints));
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_protocol = IPPROTO_TCP;
    hints.ai_flags = AI_PASSIVE;

    IResult = getaddrinfo(NULL,PORT,&hints,&result);
    if(IResult!=0){
        printf("getaddrinfo failed: %d\n",IResult);
        WSACleanup();
        return 1;
    }

    Listen = socket(result->ai_family,result->ai_socktype,result->ai_protocol);
    if(Listen==INVALID_SOCKET){
        printf("Socket creation failed; %ld\n",WSAGetLastError());
        freeaddrinfo(result);
        WSACleanup();
        return 1;
    }

    IResult = bind(Listen,result->ai_addr,(int)result->ai_addrlen);
    if(IResult==SOCKET_ERROR){
        printf("Socket bind failed: %ld\n",WSAGetLastError());
        freeaddrinfo(result);
        closesocket(Listen);
        WSACleanup();
        return 1;
    }

    //call async connect to Python 127.0.0.1:8081

    freeaddrinfo(result);

    IResult = listen(Listen,SOMAXCONN);
    if(IResult==SOCKET_ERROR){
        printf("Listener failed: %ld\n",WSAGetLastError());
        closesocket(Listen);
        WSACleanup();
        return 1;
    }

    Client = accept(Listen,NULL,NULL);
    if(Client==INVALID_SOCKET){
        printf("Accept failed %ld\n",WSAGetLastError());
        closesocket(Listen);
        WSACleanup();
        return 1;
    }

    IResult=recv(Client,recvbuf,DEFAULT_BUFFER,0);
    if(IResult>0){
        void;//call hashtable router
    } else if(IResult==0){
        printf("Closing connection\n");
    } else {
        printf("Recv failed; %ld\n",WSAGetLastError());
    }

    closesocket(Client);
    closesocket(Listen);
    WSACleanup();

    return 0;
}