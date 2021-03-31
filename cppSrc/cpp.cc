#include "cpp.h"
using namespace Napi;


Cpp::Cpp(const Napi::CallbackInfo& info) : ObjectWrap(info) {
    Napi::Env env = info.Env();
    this->chromaticNumber = info[0].As<Napi::Number>().Int32Value();
    this->numberOfNodes = info[1].As<Napi::Number>().Int32Value();
    for(int itrt=0 ; itrt < numberOfNodes ; itrt++)
        this->CppNativeNodes.push_back(info[2 + itrt * 2].As<Napi::String>().Utf8Value());
    for(int itrt=0 ; itrt<this->numberOfNodes ; itrt++){
        Napi::Object neighborNodes = info[3 + 2 * itrt].As<Napi::Object>();
        set<string> neighbors;
        for(int j=0 ; j<this->numberOfNodes ; j++)
            if(neighborNodes.Has(this->CppNativeNodes.at(j)))
                neighbors.insert(this->CppNativeNodes.at(j));

        this->CppNativeEdges.insert(pair<string,set<string> >(this->CppNativeNodes.at(itrt),neighbors));
        }
    Napi::Object temp =  info[2 + 2 * this->numberOfNodes].As<Napi::Object>();
    for(const string node : CppNativeNodes)
        if(temp.Has(node))
        {
            int len = temp.Get(node + "Length").As<Number>().Int32Value(),
            freq = temp.Get(node + "Frequency").As<Number>().Int32Value();
            PerLenGtOne.insert(pair<string,pair<int,int>>(node,pair<int,int>(len,freq)));
        }
    
    for (int i = 0; i < population_size; i++)
        this->next_generation.push_back(this->random_coloring());
        
    merge_sort(next_generation, 0, next_generation.size() - 1);

}

Napi::Value Cpp::genetic_algorithm_for_graph_coloring(const Napi::CallbackInfo& info) {
    
    Napi::Env env = info.Env();
    vector<map<int,set<string> > > previous_generation(this->next_generation);
    this->next_generation.clear();
    
    for (int i = 0; i < ceil(fraction_of_population_elite * population_size); i++)
        next_generation.push_back(previous_generation.at(i));

    while(next_generation.size() < population_size)
        next_generation.push_back(crossover(previous_generation.at(tournament_selection(0, population_size - 1)),previous_generation.at(tournament_selection(0, population_size - 1))));
    
    //mutating some of it
    for (int i = 0; i < ceil(fraction_of_population_mutated * population_size); i++)
        mutate(next_generation.at(sudorandom_number_generator(0, population_size - 1)));

    merge_sort(next_generation, 0, next_generation.size() - 1);
    return Napi::Number::New(env,1);

}
Napi::Value Cpp::conflicts_in_best_so_far_coloring(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    const int returnValue = this->conflicts(this->next_generation.front());
    return Napi::Number::New(env,returnValue);
}
Napi::Value Cpp::best_so_far(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    Object bestColoring = Object::New(env);
    map<int,set<string> > best_coloring = this->next_generation.front();
    for(map<int,set<string> >::iterator clrng_itrt = best_coloring.begin() ; clrng_itrt != best_coloring.end() ; ++clrng_itrt)
        for(set<string>::iterator nodeItrt = clrng_itrt->second.begin() ; nodeItrt != clrng_itrt->second.end() ; ++nodeItrt)
            bestColoring.Set(*nodeItrt,clrng_itrt->first);
    return bestColoring;
}

Napi::Function Cpp::GetClass(Napi::Env env) {
    return DefineClass(env, "Cpp", {
        Cpp::InstanceMethod("geneticAlgorithmForGraphColoring", &Cpp::genetic_algorithm_for_graph_coloring),
        Cpp::InstanceMethod("conflictsInBestSoFarColoring", &Cpp::conflicts_in_best_so_far_coloring),
        Cpp::InstanceMethod("bestSoFar", &Cpp::best_so_far)
    });
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::String name = Napi::String::New(env, "Cpp");
    exports.Set(name, Cpp::GetClass(env));
    return exports;
}

map<int,set<string> > Cpp::random_coloring()
{
    map<int,set<string> > coloring;
    for(int i=0 ; i<chromaticNumber ; i++)
    coloring[i] = *(new set<string>());
    for(const string node : this->CppNativeNodes)
        coloring[sudorandom_number_generator(0,chromaticNumber-1)].insert(node);
    if(!checkColoringValid(coloring))
    {
        cout<<"random coloring function is broke, it returned a non-valid coloring"<<endl;
        cin.get();
    }
    return coloring;
}
inline int sudorandom_number_generator(int left, int right)
{
    return static_cast<int>(g2() % (static_cast<long long>(right+1) - static_cast<long long>(left))) + left;
}
int Cpp::conflicts(const  map<int,set<string> > &coloring){
    int conflictCount{0};
    //This see's if the color the periods have chose is confliciting with it, this also takes care of the colors being nodes problem
    //as if a node that is a color is colored a color different that its color, it will count as a conflict
    for(int color = 0 ; color < chromaticNumber ; color++)
        for(set<string>::iterator nodes_colored_same_itrt = coloring.at(color).begin() ; nodes_colored_same_itrt != coloring.at(color).end() ; ++nodes_colored_same_itrt)
            if(CppNativeEdges[to_string(color)].find(*nodes_colored_same_itrt) != CppNativeEdges[to_string(color)].end())
            conflictCount++;

    //for each color seeing if two periods have an edge i.e. share resourses and hance cannot be colored this color
    for(map<int,set<string> >::const_iterator color_itrt = coloring.begin() ; color_itrt != coloring.end() ; ++color_itrt)
        for(set<string>::iterator nodes_colored_same_itrt = color_itrt->second.begin() ; nodes_colored_same_itrt != color_itrt->second.end() ; ++nodes_colored_same_itrt)
            for(set<string>::iterator nodes_colored_same_itrt_ = color_itrt->second.begin() ; nodes_colored_same_itrt_ != nodes_colored_same_itrt ; ++nodes_colored_same_itrt_)
                if(CppNativeEdges[*nodes_colored_same_itrt].find(*nodes_colored_same_itrt_) != CppNativeEdges[*nodes_colored_same_itrt].end())
                    conflictCount++;
    //below code makes sure that period nodes which correcpond to different length of the same period are consequtive
    for(const string node : CppNativeNodes)
        if(node.length() > 24)
            if(PerLenGtOne.find(node.substr(0,24)) != PerLenGtOne.end())
            {
                const int length = PerLenGtOne.at(node.substr(0,24)).first,
                frequency = PerLenGtOne.at(node.substr(0,24)).second;
                for(int freq=0 ; freq < frequency ; freq++)
                {
                    int arr[length];
                    for(int len=0 ; len<length ; len++)
                        arr[len] = positionInColoring(node.substr(0,24)+"Period"+StringFromInt(len)+"Freq"+StringFromInt(freq),coloring).first;
                    for(int len=1 ; len<length ; len++)
                        if(arr[len] != arr[len-1]+1)
                            conflictCount++;
                }
            }
    

    return conflictCount;
}
pair<int,set<string>::iterator> Cpp::positionInColoring(const string &node,const map<int,set<string> > &coloring)
{
    for(int i=0 ; i<chromaticNumber ; i++)
        for(set<string>::iterator nodesSameColor = coloring.at(i).begin() ; nodesSameColor != coloring.at(i).end() ; ++nodesSameColor)
            if(*nodesSameColor == node)
                return pair<int,set<string>::iterator>(i,nodesSameColor);
    cout<<"Error::positionInColoring function had a call for a node that is not in coloring"<<endl<<node<<endl;
    if(count(CppNativeNodes.begin(),CppNativeNodes.end(),node))
        cout<<"The node does exist in CppNativeNodes,just not in this coloring"<<endl;
    else
        cout<<"It doesn't exist in CppNativeNodes"<<endl;
    cout<<"Here are results of the checkvalidfunction:" << checkColoringValid(coloring)<<endl;
    cin.get();
    return pair<int,set<string>::iterator>(-1,coloring.at(0).end());
} 
int tournament_selection(int left, int right)
{
    //the propability of a number returning is an AP. The number left has 'a' probability, left + 1 has 'a-d',left +2 has probability 'a-2d' and so on.right have prob 1/(right-left+1)
    //the mathematic formula for such a problem can be derived to what is shown below.
    int n = right - left + 1;
    while (true)
    {
        int rndm1 = sudorandom_number_generator(0, n - 1), rndm2 = sudorandom_number_generator(0, n - 1);
        if (rndm2 <= n - rndm1 - 1)
            return rndm1 + left;
    }
}
map<int,set<string> > Cpp::crossover(const map<int,set<string> > &coloringOne,const map<int,set<string> > &coloringTwo)
{
    map<int,set<string> > coloring;
        for(int i=0 ; i<chromaticNumber ; i++)
    coloring[i] = *(new set<string>());
    map<string,int > ColoringOne,ColoringTwo;
    for(int i=0 ; i<chromaticNumber ; i++)
        for(set<string>::iterator nodesSameColor = coloringOne.at(i).begin() ; nodesSameColor != coloringOne.at(i).end() ; ++nodesSameColor)
            ColoringOne.insert(pair<string,int>(*nodesSameColor,i));
    for(int i=0 ; i<chromaticNumber ; i++)
        for(set<string>::iterator nodesSameColor = coloringTwo.at(i).begin() ; nodesSameColor != coloringTwo.at(i).end() ; ++nodesSameColor)
            ColoringTwo.insert(pair<string,int>(*nodesSameColor,i));

    for(const string node : CppNativeNodes)
        if(sudorandom_number_generator(0,999) < 500)
            coloring[ColoringOne[node]].insert(node);
        else
            coloring[ColoringTwo[node]].insert(node);
    if(!checkColoringValid(coloring))
    {
        cout<<"Erro::crossover function is broke. It returned a non-valid coloring"<<endl;
        cin.get();
    }
    return coloring;
}
void Cpp::mutate(map<int,set<string> > &coloring)
{
    pair<bool,string> NodeInConflict =  conflictNode(coloring); //if NodeInConflict.first is true it means the conflic results from it not being a consequtive period
    if(NodeInConflict.first && floor(probability_of_mutation_being_greedy*10000) < 10000)
    {
        int freqInverted = 0,freq=0,length = PerLenGtOne.at(NodeInConflict.second.substr(0,24)).first;
        for(int i = NodeInConflict.second.length() - 1 ; i>0 ; i--)
            if(NodeInConflict.second[i] == 'q')
                break;
            else
                freqInverted += (NodeInConflict.second[i] - '0');
        while(freqInverted)
        {
            freq += freqInverted % 10;
            freqInverted /= 10;
        }
        string Node = NodeInConflict.second.substr(0,24) + "Period0" + "Freq" + StringFromInt(freq);
        vector <int> viableColors;
        for(int i=0 ; i<chromaticNumber ; i++)
            if(CppNativeEdges[to_string(i)].find(Node) == CppNativeEdges[to_string(i)].end())
                viableColors.push_back(i);
        int colorOfChoice = viableColors.at(sudorandom_number_generator(0,viableColors.size()-1));
        for(int len=0 ; len<length ; len++)
        {
            string node = NodeInConflict.second.substr(0,24) + "Period" + StringFromInt(len) + "Freq" + StringFromInt(freq);
            pair<int,set<string>::iterator> current = positionInColoring(node,coloring);
            coloring[current.first].erase(current.second);
            coloring[colorOfChoice].insert(node);
        }
        return ;
    }
    string node;
    if( sudorandom_number_generator(0,10000) < floor(10000*probability_of_mutation_being_greedy))
        node =NodeInConflict.second;
    else
        node = CppNativeNodes.at(sudorandom_number_generator(0,numberOfNodes-1));
    pair<int,set<string>::iterator> current = positionInColoring(node,coloring);
    int newColor = sudorandom_number_generator(0,chromaticNumber-1);
    coloring[current.first].erase(current.second);
    coloring[newColor].insert(node);
    
    if(!checkColoringValid(coloring))
    {
        cout<<"mutate function is broke, it returned a non-valid coloring"<<endl;
        cin.get();
    }
}
pair<bool,string> Cpp::conflictNode(const map<int,set<string> > &coloring)
{
    // int methodOrientation = sudorandom_number_generator(0,5999);
    // if(methodOrientation < 1000)
    // {
    //     pair<bool,string> subValue = conflictNodeSubFunctionOne(coloring);
    //         if(subValue.second != "-1")
    //             return subValue;
    //     subValue = conflictNodeSubFunctionTwo(coloring);
    //         if(subValue.second != "-1")
    //             return subValue;
    //     return conflictNodeSubFunctionThree(coloring);
    // }
    // else if(methodOrientation < 2000)
    // {
    //     pair<bool,string> subValue = conflictNodeSubFunctionTwo(coloring);
    //         if(subValue.second != "-1")
    //             return subValue;
    //     subValue = conflictNodeSubFunctionOne(coloring);
    //         if(subValue.second != "-1")
    //             return subValue;
    //     return conflictNodeSubFunctionThree(coloring);
    // }
    // else if(methodOrientation < 1000)
    // {
    //     pair<bool,string> subValue = conflictNodeSubFunctionTwo(coloring);
    //         if(subValue.second != "-1")
    //             return subValue;
    //     subValue = conflictNodeSubFunctionThree(coloring);
    //         if(subValue.second != "-1")
    //             return subValue;
    //     return conflictNodeSubFunctionOne(coloring);
    // }
    // else if(methodOrientation < 1000)
    // {
    //     pair<bool,string> subValue = conflictNodeSubFunctionThree(coloring);
    //         if(subValue.second != "-1")
    //             return subValue;
    //     subValue = conflictNodeSubFunctionTwo(coloring);
    //         if(subValue.second != "-1")
    //             return subValue;
    //     return conflictNodeSubFunctionOne(coloring);
    // }
    // else if(methodOrientation < 1000)
    // {
    //     pair<bool,string> subValue = conflictNodeSubFunctionOne(coloring);
    //         if(subValue.second != "-1")
    //             return subValue;
    //     subValue = conflictNodeSubFunctionThree(coloring);
    //         if(subValue.second != "-1")
    //             return subValue;
    //     return conflictNodeSubFunctionTwo(coloring);
    // }
    // else
    // {
        pair<bool,string> subValue = conflictNodeSubFunctionThree(coloring);
            if(subValue.second != "-1")
                return subValue;
        subValue = conflictNodeSubFunctionOne(coloring);
            if(subValue.second != "-1")
                return subValue;
        return conflictNodeSubFunctionTwo(coloring);
    //} 
}
pair<bool,string> Cpp::conflictNodeSubFunctionOne(const map<int,set<string> > &coloring)
{
    int chromaticNumbersArray[chromaticNumber];
    for(int i=0 ; i<chromaticNumber ; i++)
        chromaticNumbersArray[i] = i;
    for(int i=0 ; i<chromaticNumber ; i++)
        swap(chromaticNumbersArray[i],chromaticNumbersArray[sudorandom_number_generator(i,chromaticNumber-1)]);
    for(int color = 0 ; color < chromaticNumber ; color++)
        for(set<string>::iterator nodes_colored_same_itrt = coloring.at(chromaticNumbersArray[color]).begin() ; nodes_colored_same_itrt != coloring.at(chromaticNumbersArray[color]).end() ; ++nodes_colored_same_itrt)
            if(CppNativeEdges[to_string(chromaticNumbersArray[color])].find(*nodes_colored_same_itrt) != CppNativeEdges[to_string(chromaticNumbersArray[color])].end())
                return pair<bool,string>(false,*nodes_colored_same_itrt);
    return pair<bool,string>(false,"-1");
 
}
pair<bool,string> Cpp::conflictNodeSubFunctionTwo(const map<int,set<string> > &coloring)
{
    int chromaticNumbersArray[chromaticNumber];
    for(int i=0 ; i<chromaticNumber ; i++)
        chromaticNumbersArray[i] = i;
    for(int i=0 ; i<chromaticNumber ; i++)
        swap(chromaticNumbersArray[i],chromaticNumbersArray[sudorandom_number_generator(i,chromaticNumber-1)]);
    //for each color seeing if two periods have an edge i.e. share resourses and hance cannot be colored this color
    for(int color = 0 ; color < chromaticNumber ; color++)
        for(set<string>::iterator nodes_colored_same_itrt = coloring.at(chromaticNumbersArray[color]).begin() ; nodes_colored_same_itrt != coloring.at(chromaticNumbersArray[color]).end() ; ++nodes_colored_same_itrt)
            for(set<string>::iterator nodes_colored_same_itrt_ = coloring.at(chromaticNumbersArray[color]).begin() ; nodes_colored_same_itrt_ != nodes_colored_same_itrt ; ++nodes_colored_same_itrt_)
                if(CppNativeEdges[*nodes_colored_same_itrt].find(*nodes_colored_same_itrt_) != CppNativeEdges[*nodes_colored_same_itrt].end())
                    return pair<bool,string>(false,*nodes_colored_same_itrt);
    return pair<bool,string>(false,"-1");
}
pair<bool,string> Cpp::conflictNodeSubFunctionThree(const map<int,set<string> > &coloring)
{
    //below code makes sure that period nodes which correcpond to different length of the same period are consequtive
    int numberOfNodesArray[numberOfNodes];
    for(int i=0 ; i<numberOfNodes ; i++)
        numberOfNodesArray[i] = i;
    for(int i=0 ; i<numberOfNodes ; i++)
        swap(numberOfNodesArray[i],numberOfNodesArray[sudorandom_number_generator(i,numberOfNodes-1)]);
    for(int i=0 ; i<numberOfNodes ; i++)
    {
        string node = CppNativeNodes[numberOfNodesArray[i]];    
        if(node.length() > 24)
            if(PerLenGtOne.find(node.substr(0,24)) != PerLenGtOne.end())
            {
                const int length = PerLenGtOne.at(node.substr(0,24)).first,
                frequency = PerLenGtOne.at(node.substr(0,24)).second;
                for(int freq=0 ; freq < frequency ; freq++)
                {
                    int arr[length];
                    for(int len=0 ; len<length ; len++)
                        arr[len] = positionInColoring(node.substr(0,24)+"Period"+StringFromInt(len)+"Freq"+StringFromInt(freq),coloring).first;
                    for(int len=1 ; len<length ; len++)
                        if(arr[len] != arr[len-1]+1)
                            return pair<bool,string>(true,node.substr(0,24)+"Period"+StringFromInt(len)+"Freq"+StringFromInt(freq));
                }
            }
    
    }
    return pair<bool,string>(false,"-1");

}
void Cpp::merge(vector<map<int,set<string> >> &arr, int p, int q, int r)
{
    vector<map<int,set<string> > > arr1, arr2;
    for (int i = 0; i < q - p + 1; i++)
        arr1.push_back(arr[p + i]);

    for (int i = 0; i < r - q; i++)
        arr2.push_back(arr[q + 1 + i]);
    int x{0}, y{0}, i{0};
    for (i = p; i <= r; i++)
    {
        if (x == q - p + 1 || y == r - q)
            break;
        else if ( conflicts(arr1[x]) < conflicts(arr2[y]))
            arr[i] = arr1[x++];
        else
            arr[i] = arr2[y++];
    }
    while (x < q - p + 1)
        arr[i++] = arr1[x++];
    while (y < r - q)
        arr[i++] = arr2[y++];
}
void Cpp::merge_sort(vector<map<int,set<string> > > &arr, int l, int r)
{
    if (l == r)
        return;
    int p = l + (r - l) / 2;
    merge_sort(arr, l, p);
    merge_sort(arr, p + 1, r);
    merge(arr, l, p, r);
}
string StringFromInt(int num)
{
    string str = "";
    if(num ==0 )
    return "0";
    while(num)
    {
        str += char('0'+num%10);
        num /= 10;
    }
    reverse(str.begin(), str.end());
    cout<<str<<endl;
    return str;
}
bool Cpp::checkColoringValid(const map<int,set<string> > &coloring)
{
    //every node in CppNatvesNodes must be somewhere in this coloring, if it isn't that means the coloring is wrong.
    for(const string node : this->CppNativeNodes)
    {
        bool DoesNotExist = true;
        for(map<int,set<string> >::const_iterator colorItrt = coloring.begin() ; colorItrt != coloring.end() ; colorItrt++)
            if(DoesNotExist)
                for(set<string>::iterator sameColorItrt = colorItrt->second.begin() ; sameColorItrt != colorItrt->second.end() ; sameColorItrt++)
                    if(*sameColorItrt == node){
                        DoesNotExist = false;
                        break;
                        }
        if(DoesNotExist)
            return false;
    }
    return true;
}
NODE_API_MODULE(addon, Init)
