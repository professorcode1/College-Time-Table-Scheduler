#pragma once

#include <napi.h>
#include <bits/stdc++.h>
#include <random>
class Cpp : public Napi::ObjectWrap<Cpp>
{
public:
    Cpp(const Napi::CallbackInfo&);
    Napi::Value genetic_algorithm_for_graph_coloring(const Napi::CallbackInfo&);
    Napi::Value conflicts_in_best_so_far_coloring(const Napi::CallbackInfo&);
    Napi::Value best_so_far(const Napi::CallbackInfo&);
    static Napi::Function GetClass(Napi::Env);

private:
    std::vector<std::string> CppNativeNodes;
    std::map<std::string,std::set<std::string> > CppNativeEdges;
    std::vector<std::map<int,std::set<std::string> > > next_generation;
    
    int numberOfNodes;
    int chromaticNumber;
    std::map<std::string,std::pair<int,int>> PerLenGtOne;


    int conflicts(const std::map<int,std::set<std::string> > &coloring);
    std::map<int,std::set<std::string> > random_coloring();
    std::pair<int,std::set<std::string>::iterator> positionInColoring(const std::string &node,const std::map<int,std::set<std::string> > &coloring);
    std::map<int,std::set<std::string> > crossover(const std::map<int,std::set<std::string> > &coloringOne,const std::map<int,std::set<std::string> > &coloringTwo);
    void mutate(std::map<int,std::set<std::string> > &coloringOne);
    void merge(std::vector<std::map<int,std::set<std::string> > > &arr, int p, int q, int r);
    void merge_sort(std::vector<std::map<int,std::set<std::string> > > &arr, int l, int r);
    bool checkColoringValid(const std::map<int,std::set<std::string> > &coloring);
    std::pair<bool,std::string> conflictNode(const std::map<int,std::set<std::string> > &coloring);
    int compatibleColor(const std::map<int,std::set<std::string> > &coloring,const std::string &node);
    std::pair<bool,std::string> conflictNodeSubFunctionThree(const std::map<int,std::set<std::string> > &coloring);
    std::pair<bool,std::string> conflictNodeSubFunctionOne(const std::map<int,std::set<std::string> > &coloring);
    std::pair<bool,std::string> conflictNodeSubFunctionTwo(const std::map<int,std::set<std::string> > &coloring);

};

std::mt19937 g2(std::chrono::system_clock::now().time_since_epoch().count());
const int population_size{200};
const float probability_of_mutation_being_greedy{0.1}, fraction_of_population_mutated{0.25}, fraction_of_population_elite{0.1};
using namespace std;
inline int sudorandom_number_generator(int left, int right);
int tournament_selection(int left, int right);
std::string StringFromInt(int num);


