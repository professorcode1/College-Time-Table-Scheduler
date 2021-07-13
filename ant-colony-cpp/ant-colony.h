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

using namespace emscripten;

std::string numberToString(int num);
class lecture;
class period {
public:
  period(const std::string &period_name, int period_len_value,
         int period_freq_value, int &period_id_generator,
         lecture *parent_lecture, int total_periods);
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
  friend class ant_colony;
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
  void create_ants();
  void dsatur_color(std::map<period* , int> &coloring);
  bool coloring_valid(std::map<period* , int> &coloring);
  int conflicts(std::map<period* , int> &coloring);
};