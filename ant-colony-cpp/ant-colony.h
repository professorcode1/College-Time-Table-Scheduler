#pragma once

#include <algorithm>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <iostream>
#include <map>
#include <set>
#include <vector>
#include <iterator>
#include <ostream>
#include <utility>
#include <typeinfo>
#include <exception>
#include <chrono>
#include <random>
#include<climits>
#include <list>
#include <math.h>  
#include <float.h>
using namespace emscripten;

const int MaxIter{500};
const long double alpha = 1 , beta = 5;


unsigned seed = std::chrono::system_clock::now().time_since_epoch().count();
std::mt19937 generator(seed);
std::mt19937_64 generator_64(seed);
int random_number(int left,int right);
class period;
class m;
void call_js_coloring_(const std::map<period*,int> &coloring);
std::string numberToString(int num);
int string_to_int(std::string time);
class lecture;
class M_class;
class period {
public:
  period(const std::string &period_name, int period_len_value,
         int period_freq_value, int &period_id_generator,
         lecture *parent_lecture, int total_periods);
  std::string getName();
void add_ban_time(std::string time);
  static std::map<int, period *> id_to_period_lookup;
  static std::map<std::string, period *> name_to_period_lookup;

private:
  int period_id, period_len_value, period_freq_value;
  //periods with the same freq_val, but different len_val are siblings and need to happen consequtively
  //periods without the same freq_val are cousins.   
  lecture *parent_lecture;
  std::string period_name;
  std::set<int> viable_colors;
  std::map<int,int> ants; //maps each viable_color to the number of ant of that color sitting on the period
  std::map<int,long double> trails; //maps each viable_color to the pheramone left by the ant
  friend class ant_colony;
  friend class M_class;
};
std::map<int, period *> period::id_to_period_lookup;
std::map<std::string, period *> period::name_to_period_lookup;

class lecture {
public:
  lecture(const std::string &lecture_name, int lecture_length,
          int lecture_frequency, int &lecture_id_generator,
          int &period_id_generator, int total_periods);

private:
  int lecture_id, lecture_length, lecture_frequency;
  std::string lecture_name;
  std::vector<period *> child_periods;
  friend class ant_colony;
  friend class period;
};

class ant_colony {
public:
  ant_colony(int periodsPerDay, int numberOfDays, int numberOfLectures,
             int numberOfPeriods);
  void add_lecture(std::string lecture_name, int lecture_length,
                   int lecture_frequency);
  void add_edge(std::string node_One, std::string node_Two);
  void print_all_periods();
  void initiate_coloring();

private:
  int periodsPerDay, numberOfDays, numberOfPeriods, numberOfLectures,
      period_id_generator, lecture_id_generator;
  std::vector<lecture *> lectures;
  std::map<period *, std::set<period *>> edges;
  std::map<int,std::set<int>> edges_by_period_id;
  std::map<std::pair<period*,int>,int> neighbor_ant_count; //given a period and color, 
  //it tells sum of all ants of that color over adjacent nodes 
  void create_ants();
  void dsatur_color(std::map<period* , int> &coloring,int** neighbor_color_counter);
  bool coloring_valid(std::map<period* , int> &coloring);
  int conflicts(const std::map<period* , int> &coloring,int** neighbor_color_counter);
  period* node_to_be_recolored(std::map<period* , int> &coloring);
  void fill_M(M_class &M,const std::map<std::pair<period*,int>,int > &tabu_table,period* X,int i);
  void node_to_be_recolored(std::set<period*> &A,std::map<period* , int> &coloring);
  void choose_Nxi(m* M_choose_Nxi[],const M_class &M,int N__x__i);
  friend class M_class;
};

class m{
  public:
  m(period* y,int color,long adv,long disAdv,long double Trail);
  private:
  period* y;
  int color;
  long adv,disAdv;
  long double Trail;
  friend class M_class;
  friend class ant_colony;
};

class M_class{
  public:
  M_class();
  ~M_class();
  void add_move(period* x,int i,period* y,int j,ant_colony* colony);
  void sort(period* X,int i,int** neighbor_color_counter);
  private:
  std::vector<m*> move_list;
  m *maxAdvMove,*maxDisAdvMove,*minAdvMove,*minDisAdvMove,*minTrailMove,*maxTrailMove;
  long maxAdvVal,maxDisAdvVal,minAdvVal,minDisAdvVal;
  long double minTrailVal,maxTrailVal;
  friend class ant_colony;
};

void update_js(int iterations,int conflicts);
