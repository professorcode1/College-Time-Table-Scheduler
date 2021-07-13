#include "ant-colony.h"
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
        vaiable_colors.insert(i);
    //std::cout<<period_name<<" "<<period_id<<std::endl;
}
void period::add_ban_time(std::string time){
    int time_num = 0;
    for(int i=0; time[i] ; i++)
    {
        time_num *= 10;
        time_num += static_cast<int>(time[i]-'0');
    }
    this->vaiable_colors.erase(time_num);
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
        std::cout<<it->second->period_name<<std::endl;
        for(const period* prd_pntr : edges.at(it->second))
            std::cout<<"\t"<<prd_pntr->period_name<<"\n";
        std::copy(it->second->vaiable_colors.begin(),it->second->vaiable_colors.end(),std::ostream_iterator<int>(std::cout," "));
    }
}
// Binding code
EMSCRIPTEN_BINDINGS(my_class_example) {
  class_<ant_colony>("ant_colony")
    .constructor<int, int,int,int>()
    .function("add_lecture",&ant_colony::add_lecture)
    .function("add_edge",&ant_colony::add_edge)
    .function("print_all_periods",&ant_colony::print_all_periods)
    ;
}