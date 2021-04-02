#include "cpp.h"
using namespace Napi;

period::period(std::string id,int length,int frequency,std::vector<int> viableColors){
    this->id = id;
    this->length = length;
    this->frequency = frequency;
    this->viableColors = viableColors;
}
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
    this->numberOfPeriods = info[3 + 2 * this->numberOfNodes].As<Napi::Number>().Int32Value();
    cout<<"Starting periods construction"<<endl;
    for(int itrt=0 ; itrt<this->numberOfPeriods ; itrt++)
        {
            string id = (info[4 + 2 * this->numberOfNodes + itrt].As<Napi::Object>()).Get("id").As<Napi::String>().Utf8Value();
            int length = (info[4 + 2 * this->numberOfNodes + itrt].As<Napi::Object>()).Get("length").As<Napi::Number>().Int32Value();
            int frequency = (info[4 + 2 * this->numberOfNodes + itrt].As<Napi::Object>()).Get("frequency").As<Napi::Number>().Int32Value();
            vector<int> viableColors;
            for(int color = 0 ; color < chromaticNumber ; color++)
                if(CppNativeEdges.at(StringFromInt(color)).find(id + "Period0Freq0") == CppNativeEdges.at(StringFromInt(color)).end())
                    viableColors.push_back(color);
            this->periods.push_back(period(id,length,frequency,viableColors));
        }
        cout<<"periods constructed"<<endl;
    for (int i = 0; i < population_size; i++)
        this->next_generation.push_back(this->random_coloring());
    
    cout<<"Calling merge sort"<<endl;
    merge_sort(next_generation, 0, next_generation.size() - 1);
    cout<<"Construction complete"<<endl;
}

Napi::Value Cpp::genetic_algorithm_for_graph_coloring(const Napi::CallbackInfo& info) {
    
    Napi::Env env = info.Env();
    printf("Genetic algorithm engaged\n");
    cout<<next_generation.size()<<endl;
    vector<map<int,set<string> > > previous_generation(this->next_generation);
    this->next_generation.clear();
        
        
    for (int i = 0; i < ceil(fraction_of_population_elite * population_size); i++)
        next_generation.push_back(previous_generation.at(i));


    printf("CrossOver\n");
    const int workPerThread = floor(static_cast<float>(crossovers) / numberOfThreads);
    vector< future < vector<map < int,set<string> >> > > multiThread; //we multithread the crossover
    for(int i=0 ; i<numberOfThreads-1 ; i++ )
            multiThread.push_back(async(std::launch::async,[&previous_generation,this](const int numberOfTablesRequired)->vector<map<int,set<string> > >{
                //cout<<numberOfTablesRequired << endl;
                vector<map<int,set<string> > > returnVec;
                for (int loop_var = 0; loop_var < numberOfTablesRequired; loop_var++)
                    returnVec.push_back(crossover(previous_generation.at(tournament_selection(0, population_size - 1)),previous_generation.at(tournament_selection(0, population_size - 1))));
                return returnVec;
            },  workPerThread ));        
    for (int loop_var = 0; loop_var < crossovers - (numberOfThreads-1) * workPerThread; loop_var++)
        next_generation.push_back(crossover(previous_generation.at(tournament_selection(0, population_size - 1)),previous_generation.at(tournament_selection(0, population_size - 1))));
        
    for(int i=0 ; i<numberOfThreads-1 ; i++)
        for(const auto table : multiThread.at(i).get())
            next_generation.push_back(table);


    printf("mutate\n");
    //mutating some of it
    for (int i = 0; i < ceil(fraction_of_population_mutated * population_size); i++)
        mutate(next_generation.at(sudorandom_number_generator(0, population_size - 1)));

    printf("soritng\n");
    custom_sort(next_generation);
    cout<<"Genetic algo complete"<<endl;
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
    for(int color=0 ; color < chromaticNumber ; color++)
        coloring[color] = *(new set<string>());
    for(const period Period : periods)
        for(int freq=0 ; freq<Period.frequency ; freq++)
        {
            int color = Period.viableColors.at(sudorandom_number_generator(0,Period.viableColors.size()-1));
            for(int len=0 ; len<Period.length ; len++)
                coloring[color+len].insert(Period.id + "Period" + StringFromInt(len) + "Freq" + StringFromInt(freq));
        }
    if(!checkColoringValid(coloring))
    {
        cout<<"Random coloring Function is broken. Invalid coloring produces."<<endl;
        cin.get();
    }

    return coloring;
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
    // for(const string node : CppNativeNodes)
    //     if(node.length() > 24)
    //         if(PerLenGtOne.find(node.substr(0,24)) != PerLenGtOne.end())
    //         {
    //             const int length = PerLenGtOne.at(node.substr(0,24)).first,
    //             frequency = PerLenGtOne.at(node.substr(0,24)).second;
    //             for(int freq=0 ; freq < frequency ; freq++)
    //             {
    //                 int arr[length];
    //                 for(int len=0 ; len<length ; len++)
    //                     arr[len] = positionInColoring(node.substr(0,24)+"Period"+StringFromInt(len)+"Freq"+StringFromInt(freq),coloring).first;
    //                 for(int len=1 ; len<length ; len++)
    //                     if(arr[len] != arr[len-1]+1)
    //                         conflictCount++;
    //             }
    //         }
    

    return conflictCount;
}

map<int,set<string> > Cpp::crossover(const map<int,set<string> > &coloringOne,const map<int,set<string> > &coloringTwo)
{
    map<int,set<string> > coloring;
    for(int color = 0 ; color < chromaticNumber ; color++)
        coloring[color]=*(new set<string>());
    for(const period Period : periods)
        for(int freq=0 ; freq<Period.frequency ; freq++)
        {
            int color;
            if(sudorandom_number_generator(0,1000) < 500)
                color = positionInColoring(Period.id + "Period0Freq"+StringFromInt(freq),coloringOne).first;
            else
                color = positionInColoring(Period.id + "Period0Freq"+StringFromInt(freq),coloringTwo).first;
            for(int len=0 ; len<Period.length ; len++)
                coloring[color+len].insert(Period.id + "Period" + StringFromInt(len) + "Freq" + StringFromInt(freq));
        }
    if(!checkColoringValid(coloring))
    {
        cout<<"Crossover Function is broken. Invalid coloring produces."<<endl;
        cin.get();
    }
        return coloring;
}
void Cpp::mutate(map<int,set<string> > &coloring)
{
    while(true)
    {
        const period PeriodOne = periods.at(sudorandom_number_generator(0,numberOfPeriods-1));
        int freq = sudorandom_number_generator(0,PeriodOne.frequency-1),len = sudorandom_number_generator(0,PeriodOne.length-1);
        const string nodeOne = PeriodOne.id+"Period"+StringFromInt(len)+"Freq" + StringFromInt(freq);
        if(inConflict(coloring,nodeOne) || sudorandom_number_generator(0,10000)  < floor(10000 * probability_of_mutation))
        {
            pair<int,set<string>::iterator> lenZeroColor = positionInColoring(PeriodOne.id+"Period0Freq" + StringFromInt(freq),coloring);
            int newColor = sudorandom_number_generator(0,100) < 50 ? BestColor(PeriodOne,freq,coloring) : PeriodOne.viableColors.at(sudorandom_number_generator(0,PeriodOne.viableColors.size()-1));
            for(int lenVar = 0; lenVar < PeriodOne.length ; lenVar++)
                coloring.at(lenZeroColor.first + lenVar).erase(PeriodOne.id+"Period"+StringFromInt(lenVar)+"Freq" + StringFromInt(freq));
            for(int lenVar = 0; lenVar < PeriodOne.length ; lenVar++)
                coloring.at(newColor + lenVar).insert(PeriodOne.id+"Period"+StringFromInt(lenVar)+"Freq" + StringFromInt(freq));
            
            return ;
        }
    }
}
int Cpp::BestColor(const period &Period,int freq,const map<int,set<string> > &coloring)
{
    int bestColor = Period.viableColors.at(sudorandom_number_generator(0,Period.viableColors.size()-1)) , leastConflict = INT_MAX;
    for(int color : Period.viableColors)
    {
        int conflictThisColor = 0;
        for(int len=0 ; len<Period.length ; len++)
        {
            string node = Period.id+"Period"+StringFromInt(len) +"Freq"+StringFromInt(freq);
            pair<int,set<string>::iterator> position = positionInColoring(node,coloring);
            if(CppNativeEdges.at(node).find(StringFromInt(position.first)) != CppNativeEdges.at(node).end())
                conflictThisColor++;
            for(set<string>::iterator sameColorItrt = coloring.at(position.first).begin() ; sameColorItrt != coloring.at(position.first).end() ; sameColorItrt++)
                if(CppNativeEdges.at(*position.second).find(*sameColorItrt) != CppNativeEdges.at(*position.second).end())
                    conflictThisColor++;
        }
        if(conflictThisColor < leastConflict)
            bestColor = color;
    }
    return bestColor;
}
bool Cpp::inConflict(const map<int,set<string> > &coloring,const string &node)
{
    pair<int,set<string>::iterator> position = positionInColoring(node,coloring);
    if(CppNativeEdges.at(node).find(StringFromInt(position.first)) != CppNativeEdges.at(node).end())
        return true;
    for(set<string>::iterator sameColorItrt = coloring.at(position.first).begin() ; sameColorItrt != coloring.at(position.first).end() ; sameColorItrt++)
        if(CppNativeEdges.at(*position.second).find(*sameColorItrt) != CppNativeEdges.at(*position.second).end())
            return true;
    return false;
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
    return str;
}
bool Cpp::checkColoringValid(const map<int,set<string> > &coloring)
{
    //every node in CppNatvesNodes must be somewhere in this coloring, if it isn't that means the coloring is wrong.
    for(const string node : this->CppNativeNodes)
    {
        if(node.length() < 24)
            continue;
        bool DoesNotExist = true;
        for(map<int,set<string> >::const_iterator colorItrt = coloring.begin() ; colorItrt != coloring.end() ; colorItrt++)
            if(DoesNotExist)
                for(set<string>::iterator sameColorItrt = colorItrt->second.begin() ; sameColorItrt != colorItrt->second.end() ; sameColorItrt++)
                    if(*sameColorItrt == node){
                        DoesNotExist = false;
                        break;
                        }
        if(DoesNotExist)
        {
            cout<<"The table supplied doesn't have a period from the list of all nodes"<<endl;
            return false;
        }
    }
    for(const string node : CppNativeNodes)
        if(node.length() > 24)
            if(PerLenGtOne.find(node.substr(0,24)) != PerLenGtOne.end()) //implies that the period has length greater than one 
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
                            {
                                cout<<"The nodes with different len are not together"<<endl;
                                return false;}
                }
            }
    return true;
}
inline int sudorandom_number_generator(int left, int right)
{
    return static_cast<int>(g2() % (static_cast<long long>(right+1) - static_cast<long long>(left))) + left;
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
void Cpp::custom_sort(vector< map<int, set< string > > > &arr)
{
    cout<<arr.size()<<endl;
    vector<future<vector<pair<int,map<int,set<string > > > > > > multiThread;
    vector<pair<int,map<int,set<string > > > > sortableVec;
    const int workPerThread = population_size / numberOfThreads;
    for(int i=0 ; i < numberOfThreads ; i++)
        multiThread.push_back(async(std::launch::async,[&](const int left,const int right)->vector<pair<int,map<int,set<string > > > >{
            cout<<left<<"   "<<right<<endl;
                vector<pair<int,map<int,set<string > > > > returnVec;
                for (int loop_var = left; loop_var < right; loop_var++)
                    returnVec.push_back(make_pair(conflicts(arr.at(loop_var)),arr.at(loop_var)));
                return returnVec;
            }, i * workPerThread , (i+1)*workPerThread ));
    for (int loop_var = (numberOfThreads-1) * workPerThread; loop_var < (numberOfThreads-1) * workPerThread + (population_size%numberOfThreads); loop_var++)
                    sortableVec.push_back(make_pair(conflicts(arr.at(loop_var)),arr.at(loop_var)));
    for(int i = 0 ;i <numberOfThreads ; i++)
        for(const auto coloring : multiThread.at(i).get())
            sortableVec.push_back(coloring);
    sort(sortableVec.begin(),sortableVec.end(),[](const pair<int,map<int,set<string > > > &left,const pair<int,map<int,set<string > > > &right)->bool{return left.first < right.first;});
    cout<<endl<<sortableVec.size()<<endl;
    for(int i=0 ; i<population_size ; i++)
        arr.at(i) = sortableVec.at(i).second;
}
NODE_API_MODULE(addon, Init)