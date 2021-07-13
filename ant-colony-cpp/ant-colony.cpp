#include "ant-colony.h"
#include <iterator>
#include <utility>
std::string numberToString(int num){
    if(num == 0)
        return "0";
    std::string str = "";
    while(num){
        str += static_cast<char>('0' + num%10);
        num /= 10;
    }
    std::reverse(str.begin(),str.end());
    return str;
}
lecture::lecture(const std::string &lecture_name,int lecture_length , int lecture_frequency , int &lecture_id_generator , int &period_id_generator,int total_periods){
    //std::cout<<"lecture constructor called"<<std::endl;
    this->lecture_name = lecture_name;
    this->lecture_length = lecture_length;
    this->lecture_frequency = lecture_frequency;
    this->lecture_id = lecture_id_generator++;
    //std::cout<<"all good till here in the lecture constuctor"<<std::endl;
    for(int freq=0 ; freq<lecture_frequency ; freq++)
        for(int len=0 ; len<lecture_length ; len++)
            this->child_periods.push_back(new period(lecture_name+"Period"+numberToString(len)+"Freq"+numberToString(freq),len,freq,period_id_generator,this,total_periods));
}
period::period(const std::string &period_name,int period_len_value ,int period_freq_value,int &period_id_generator,lecture* parent_lecture,int total_periods){
    //std::cout<<"period constructor entered"<<std::endl;
    this->period_name = period_name;
    this->period_len_value = period_len_value;
    this->period_freq_value = period_freq_value;
    this->period_id = period_id_generator++;
    this->parent_lecture = parent_lecture;
    //std::cout<<"is this the issue?"<<std::endl;
    id_to_period_lookup.insert(std::make_pair(this->period_id,this));
    //std::cout<<"no that ain't issue"<<std::endl;
    name_to_period_lookup.insert(std::make_pair(this->period_name,this));
    for(int i=0 ; i<total_periods ; i++)
        viable_colors.insert(i);
    //std::cout<<period_name<<" "<<period_id<<std::endl;
}
void period::add_ban_time(std::string time){
    int time_num = 0;
    for(int i=0; time[i] ; i++)
    {
        time_num *= 10;
        time_num += static_cast<int>(time[i]-'0');
    }
    this->viable_colors.erase(time_num);
}
ant_colony::ant_colony(int periodsPerDay,int numberOfDays,int numberOfLectures,int numberOfPeriods){
    this->periodsPerDay = periodsPerDay;
    this->numberOfDays = numberOfDays;
    this->numberOfLectures = numberOfLectures;
    this->numberOfPeriods = numberOfPeriods;
    this->period_id_generator = 0;
    this->lecture_id_generator = 0;
}
void ant_colony::add_lecture(std::string lecture_name,int lecture_length , int lecture_frequency){
    //std::cout<<lecture_name<<" "<<lecture_length<<" "<<lecture_frequency<<std::endl;
    lectures.push_back(new lecture(lecture_name,lecture_length,lecture_frequency,lecture_id_generator,period_id_generator,periodsPerDay * numberOfDays));
    std::set<period*> arbitrary_set; //since the insert needs an l-value
    for(period* prd_pntr :lectures.back()->child_periods)
        this->edges.insert(std::pair<period*,std::set<period*> >(prd_pntr,arbitrary_set));
    //std::cout<<"equal now?"<<" "<<period::name_to_period_lookup.size()<<" "<<numberOfPeriods<<std::endl;
}
void ant_colony::add_edge(std::string node_One , std::string node_Two){
    if(node_One.length() < 24 && node_Two.length() < 24)
        return ;
    else if(node_One.length() < 24 && node_Two.length() > 24)
        period::name_to_period_lookup.at(node_Two)->add_ban_time(node_One);
    else if(node_One.length() > 24 && node_Two.length() < 24)
        period::name_to_period_lookup.at(node_One)->add_ban_time(node_Two);
    else{
        edges.at(period::name_to_period_lookup.at(node_One)).insert(period::name_to_period_lookup.at(node_Two));
        edges.at(period::name_to_period_lookup.at(node_Two)).insert(period::name_to_period_lookup.at(node_One));
    }
}
void ant_colony::print_all_periods(){
    for(std::map<int,period*>::iterator it=period::id_to_period_lookup.begin() ; it != period::id_to_period_lookup.end() ; it++){
        std::cout<<it->second->period_name<<" "<<it->second->period_id<<std::endl;
        //for(const period* prd_pntr : edges.at(it->second))
        //    std::cout<<"\t"<<prd_pntr->period_name<<"\n";
        std::copy(it->second->viable_colors.begin(),it->second->viable_colors.end(),std::ostream_iterator<int>(std::cout," "));
    }
}
void ant_colony::initiate_coloring(){
    std::map<period* , int> coloring;
    std::set<std::pair<period*,int> > tabu_table;
    create_ants();
    dsatur_color(coloring);
    if(coloring_valid(coloring))
        std::cout<<"COLORING VALID"<<std::endl;
    else{
        std::cout<<"COLORING INVALID"<<std::endl;
        return;
    }
    std::cout<<"CONFLICTS\t::\t"<<conflicts(coloring)<<std::endl;
}
int ant_colony::conflicts(std::map<period* , int> &coloring){
    //an edge b/w two nodes of the same color counts as conflict
    int conflict_counter{0};
    for(std::map<period*,std::set<period*> >::iterator itrt = edges.begin() ; itrt != edges.end() ; itrt++){
        period* node = itrt->first;
        for(period* neighbor_node:itrt->second)
            if(coloring.at(node) == coloring.at(neighbor_node))
                conflict_counter++;
    }
    return conflict_counter/2;
}
void ant_colony::dsatur_color(std::map<period* , int> &coloring){
    //there is no set A declared as hlpr_ds_0 acts as A. Once a node is colored, it will be taken out of it as well.
    std::set<std::pair<std::pair<int,int>,period* > > hlpr_data_structure_zero;
    //left.left will be saturation degree,left.right will be degree , and right will period pointer 
    //so the first element of this data structure will always be the node to be taken out
    std::map<period*,int> hlpr_data_structure_one;
    //this will map each period to its saturation degree. A periods degree can be calculated in O(1) anyways
    //so this will help update hlpr_data_structure_zero in one operation
    for(std::map<int,period*>::iterator itrt = period::id_to_period_lookup.begin() ; itrt != period::id_to_period_lookup.end() ; itrt++){
        hlpr_data_structure_zero.insert(std::make_pair(std::make_pair(0,edges.at(itrt->second).size()),itrt->second));
        hlpr_data_structure_one.insert(std::make_pair(itrt->second,0));
    }
    int neighbor_color_counter[numberOfPeriods][periodsPerDay*numberOfDays];
    for(int i=0 ; i<numberOfPeriods ; i++)
        for(int j=0 ; j < periodsPerDay*numberOfDays ; j++)
            neighbor_color_counter[i][j] = 0;
    while(!hlpr_data_structure_zero.empty()){
        std::cout<<"CURRENT COLORING SIZE\t"<<coloring.size()<<std::endl;
        const period* node = hlpr_data_structure_zero.rbegin()->second;
        if(node->period_len_value != 0)
            node = period::id_to_period_lookup.at(node->period_id - node->period_len_value);
        //makes sure the period we dealing with has a len_val = 0 i.e. it is a starting period 
        int best_color = *node->viable_colors.begin();
        int min_conflicts = neighbor_color_counter[node->period_id][best_color];
        bool beginning_color_ant_count_zero = node->ants.at(best_color) == 0;
        for(std::set<int>::iterator vbl_clr_itrt = node->viable_colors.begin(); vbl_clr_itrt != node->viable_colors.end() ; vbl_clr_itrt++){
            if(beginning_color_ant_count_zero && node->ants.at(*vbl_clr_itrt) != 0){
                best_color = *vbl_clr_itrt;
                min_conflicts = neighbor_color_counter[node->period_id][best_color];
                beginning_color_ant_count_zero = false;
                continue;
            }
            if(node->ants.at(*vbl_clr_itrt) != 0 && neighbor_color_counter[node->period_id][*vbl_clr_itrt] < min_conflicts){
                best_color = *vbl_clr_itrt;
                min_conflicts = neighbor_color_counter[node->period_id][best_color];
            }
        }
        //bunch of things I need to do
        for(int len=0 ; len < node->parent_lecture->lecture_length ; len++){
            period* siblingNode =  period::id_to_period_lookup.at(node->period_id+len);
            int color = best_color + len;
            //1)Put the node and its siblings into the coloring map
            coloring.insert(std::make_pair(siblingNode,color));
            for(period* neighbor_node : edges.at(siblingNode)){
                neighbor_color_counter[neighbor_node->period_id][color]++;
                if(hlpr_data_structure_one.find(neighbor_node) == hlpr_data_structure_one.end())
                    continue;
                int saturation_of_neighbor = hlpr_data_structure_one.at(neighbor_node);
                hlpr_data_structure_zero.erase(hlpr_data_structure_zero.find(std::make_pair(std::make_pair(saturation_of_neighbor,edges.at(neighbor_node).size()),neighbor_node)));
                hlpr_data_structure_zero.insert(std::make_pair(std::make_pair(saturation_of_neighbor+1,edges.at(neighbor_node).size()),neighbor_node));
                hlpr_data_structure_one.at(neighbor_node)++;
            }
        }
        for(int len=0 ; len < node->parent_lecture->lecture_length ; len++){
            period* siblingNode =  period::id_to_period_lookup.at(node->period_id+len);
            hlpr_data_structure_zero.erase(std::make_pair(std::make_pair(hlpr_data_structure_one.at(siblingNode),edges.at(siblingNode).size()),siblingNode));
            hlpr_data_structure_one.erase(siblingNode);
        }
    }
}
void ant_colony::create_ants(){
    for(std::map<int,period*>::iterator itrt = period::id_to_period_lookup.begin() ; itrt != period::id_to_period_lookup.end() ; itrt++){
        for(int color:itrt->second->viable_colors)
            itrt->second->ants.insert(std::make_pair(color,periodsPerDay*numberOfDays));
    }
}
bool ant_colony::coloring_valid(std::map<period* , int> &coloring){
    for(lecture* lec : lectures){
        for(int freq=0 ; freq<lec->lecture_frequency ; freq++){
            bool all_sibling_together = true;
            for(int len=0 ; len<lec->lecture_length ; len++){
                std::string periodName = lec->lecture_name+"Period"+numberToString(len)+"Freq"+numberToString(freq);
                period* node = period::name_to_period_lookup.at(periodName);
                if(coloring.find(node) == coloring.end()){
                    std::cout<<"COLORING INVALID "<<node->period_id <<" doesn't exist"<<std::endl;
                    return false;
                }
                if(len == 0)
                    continue;
                if(coloring.at(period::id_to_period_lookup.at(node->period_id-1)) + 1 != coloring.at(node)){
                    std::cout<<"COLORING INVALID "<<node->period_id <<" doesn't have consecutive color to its sibling"<<std::endl;
                    return false;
                }
            }
        }
    }
    return true;
}
// Binding code
EMSCRIPTEN_BINDINGS(my_class_example) {
  class_<ant_colony>("ant_colony")
    .constructor<int, int,int,int>()
    .function("add_lecture",&ant_colony::add_lecture)
    .function("add_edge",&ant_colony::add_edge)
    .function("print_all_periods",&ant_colony::print_all_periods)
    .function("initiate_coloring",&ant_colony::initiate_coloring)
    ;
}