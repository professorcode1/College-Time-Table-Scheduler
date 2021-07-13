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
  lecture *parent_lecture;
  std::string period_name;
  std::set<int> vaiable_colors;
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

private:
  int periodsPerDay, numberOfDays, numberOfPeriods, numberOfLectures,
      period_id_generator, lecture_id_generator;
  std::vector<lecture *> lectures;
  std::map<period *, std::set<period *>> edges;
};