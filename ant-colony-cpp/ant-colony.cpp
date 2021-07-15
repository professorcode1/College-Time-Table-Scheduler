#include "ant-colony.h"
#include <cfloat>
#include <climits>
#include <cmath>
#include <iterator>
#include <utility>

int random_number(int left, int right){
    //returns a number b/w [left,right)
    if(left > right){
        std::cout<<"Invaid input TO random_number_function\t"<<left<<"\t"<<right<<std::endl;
        return left;
    }
    else if(left == right)
        return left;
    int n = right - left;
    return left + static_cast<int>(generator() % n);
}

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
    //below is the algorithm taken straight from the paper
    //     1. set t = 0; (this one is redundant)
    //     2. place one ant of each color on each vertex;
    //     3. initialize the trails of each color on each vertex to 1;
    //     4. apply the Color procedure with A = V ; let s be the so obtained solution;
    //     5. set t = 1, t` = 1, A = V , f* = f(s), and s* = s;
    //     6. while t` < MaxIter and f* > 0, do
    //         (a) determine the set M(t) of the possible non tabu moves for iteration t;
    //         (b) compute the greedy force GF(m,t) and the trail Tr(m,t), ∀ ∈ M(t);
    //         (c) normalize the greedy forces and the trails in [0, 1];
    //         (d) perform the non tabu move m ∈ M(t) maximizing p(M,t); let m = (x,i) ↔ (y, j)
    //             be such a move;
    //         (e) while there is at least one ant of color i on x, perform the move m maximizing p(M,t)
    //             among the moves in {m = (x,i) ↔ (y, j) ∈ M(t) | y != x and color j is represented on y};
    //         (f) update the trails tr(v, c) for each vertex v and each color c, then normalize those
    //             quantities;
    //         (g) update the tabu status;
    //         (h) set A = { vertices involved in a move performed at iteration t }∪{ conflicting vertices
    //             at iteration t − 1 };
    //         (i) update the colors of the vertices in A using the Color procedure; let s be the so
    //         obtained solution;
    //         (j) if f(s) < f*, set s* = s, f* = f(s), and t` = −1;
    //         (k) set t = t + 1 and t` = t` + 1;

    //STEP 2 and 3
    create_ants();

    //STEP 4
    std::map<period* , int> coloring;
    for(auto int_and_period : period::id_to_period_lookup)
        coloring.insert(std::make_pair(int_and_period.second,-1));
    //hlpr_ds_0 acts as A
    //left.left will be saturation degree,left.right will be degree , and right will period pointer 
    //so the last element of this data structure will always be the node to be taken out
    std::set<std::pair<std::pair<int,int>,period* > > hlpr_data_structure_zero;
    //this will map each period to its saturation degree. A periods degree can be calculated in O(1) anyways
    //so this will help update hlpr_data_structure_zero in 2logn operation.Otherwise it will take O(n)
    std::map<period*,int> hlpr_data_structure_one;
    //initalising A = V
    for(std::map<int,period*>::iterator itrt = period::id_to_period_lookup.begin() ; itrt != period::id_to_period_lookup.end() ; itrt++){
        hlpr_data_structure_zero.insert(std::make_pair(std::make_pair(0,edges.at(itrt->second).size()),itrt->second));
        hlpr_data_structure_one.insert(std::make_pair(itrt->second,0));
    }
    int** neighbor_color_counter = new int*[numberOfPeriods];
    for(int i=0; i<numberOfPeriods ; i++)
        neighbor_color_counter[i] =new int[periodsPerDay*numberOfDays];
    for(int i=0 ; i<numberOfPeriods ; i++)
        for(int j=0 ; j < periodsPerDay*numberOfDays ; j++)
            neighbor_color_counter[i][j] = 0;
    
    dsatur_color(coloring,hlpr_data_structure_zero,hlpr_data_structure_one,neighbor_color_counter);
    if(coloring_valid(coloring))
        std::cout<<"COLORING VALID"<<std::endl;
    else{
        std::cout<<"COLORING INVALID"<<std::endl;
        return;
    }
    //STEP 5
    std::map<std::pair<period*,int>,int > tabu_table; //map period, color to its tabu tenure
    int iterations{1} , least_conflicts{conflicts(coloring)} , iterations_without_improvment{1};
    int conflicts{least_conflicts};
    std::map<period* , int> best_coloring(coloring);
    update_js(iterations,least_conflicts);

    //STEP 6
    while(iterations_without_improvment < MaxIter && least_conflicts > 0){
        //a,b and c (in the implimentation they happen simultaneously )
        period* X = node_to_be_recolored(coloring);
        int i =  coloring.at(X);
        int N_i = X->ants.at(i);
        M_class M; //y , j
        fill_M(M,tabu_table,X,i);
        M.sort();

        //d and e
    }
}
void M_class::sort(){
    double maxGr{-DBL_MAX},minGr{DBL_MAX};
    for(m* move : move_list){
        double normalised_Adv = (static_cast<double>(move->adv) - minAdvVal) / static_cast<double>(maxAdvVal - minAdvVal);
        double normalised_DisAdv = (static_cast<double>(move->disAdv) - minDisAdvVal)/static_cast<double>(maxDisAdvVal-minDisAdvVal);
        double Gr = normalised_Adv - normalised_DisAdv;
        if(Gr > maxGr)
            maxGr = Gr;
        if(Gr < minGr)
            minGr = Gr;
    }
    std::sort(move_list.begin(),move_list.end(),[this,maxGr,minGr](m* left,m* right){
        double normalised_Adv_l = (static_cast<double>(left->adv) - minAdvVal) / static_cast<double>(maxAdvVal - minAdvVal);
        double normalised_DisAdv_l = (static_cast<double>(left->disAdv) - minDisAdvVal)/static_cast<double>(maxDisAdvVal-minDisAdvVal);
        double normalised_Adv_r = (static_cast<double>(right->adv) - minAdvVal) / static_cast<double>(maxAdvVal - minAdvVal);
        double normalised_DisAdv_r = (static_cast<double>(right->disAdv) - minDisAdvVal)/static_cast<double>(maxDisAdvVal-minDisAdvVal);
        double normalised_GR_l = (normalised_Adv_l - normalised_DisAdv_l - minGr) / (maxGr - minGr);
        double normalised_GR_r = (normalised_Adv_r - normalised_DisAdv_r - minGr) / (maxGr - minGr);
        double nrml_trail_l = (left->Trail - minTrailVal)/(maxTrailVal - minTrailVal);
        if(isnan(nrml_trail_l))
            nrml_trail_l = 1;
        double nrml_trail_r = (right->Trail - minTrailVal)/(maxTrailVal - minTrailVal);
        if(isnan(nrml_trail_r))
            nrml_trail_r = 1;
        double left_fitness = alpha * normalised_GR_l + beta * nrml_trail_l;
        double right_fitness = alpha * normalised_GR_r + beta * nrml_trail_r;
        return left_fitness > right_fitness; 
    });
    std::cout<<"maxAdvVal "<<maxAdvVal << "\tminAdvVal "<<minAdvVal<<"\tminDisAdvVal "<<minDisAdvVal<<"\tmaxDisAdvVal "<<maxDisAdvVal<<std::endl;
    std::cout<<"maxGr " << maxGr << "\tminGr "<<minGr<<"\tminTrailVal "<<minTrailVal<<"\tmaxTrailVal "<<maxTrailVal<<std::endl;
    for(int i=0 ; i<move_list.size() ; i++)
    {
        m* left = move_list.at(i);
        double normalised_Adv_l = (static_cast<double>(left->adv) - minAdvVal) / static_cast<double>(maxAdvVal - minAdvVal);
        double normalised_DisAdv_l = (static_cast<double>(left->disAdv) - minDisAdvVal)/static_cast<double>(maxDisAdvVal-minDisAdvVal);
        double normalised_GR_l = (normalised_Adv_l - normalised_DisAdv_l - minGr) / (maxGr - minGr);
        double nrml_trail_l = (left->Trail - minTrailVal)/(maxTrailVal - minTrailVal);
        if(isnan(nrml_trail_l))
            nrml_trail_l = 1;
        double left_fitness = alpha * normalised_GR_l + beta * nrml_trail_l;
        std::cout<<"normalised_Adv_l "<<normalised_Adv_l<<"\tnormalised_DisAdv_l "<<normalised_DisAdv_l<<"\tnormalised_GR_l "<<normalised_GR_l<<"\tnrml_trail_l "<<nrml_trail_l<<std::endl;
        std::cout<<i<<"\t"<<left_fitness<<std::endl;
    }
}
void ant_colony::fill_M(M_class &M,const std::map<std::pair<period*,int>,int > &tabu_table,period* X,int i){
    for(period* neighbor_node : edges.at(X)){
            if(neighbor_node->viable_colors.find(i) == neighbor_node->viable_colors.end())
                continue;
            std::set<int>::iterator first1{X->viable_colors.begin()}, last1{X->viable_colors.end()}, first2{neighbor_node->viable_colors.begin()}, last2{neighbor_node->viable_colors.end()};
            while (first1!=last1 && first2!=last2){
                if (*first1<*first2) ++first1;
                else if (*first2<*first1) ++first2;
                else {
                    //std::cout<<"fill_M\t::\tCalling add_move"<<(*first1)<<"\t"<<(*first2)<<std::endl;
                    if(*first1 != i && tabu_table.find(std::make_pair(neighbor_node,*first1)) == tabu_table.end())
                        M.add_move(X,i,neighbor_node,*first1,this);
                    ++first1; ++first2;
                    //std::cout<<"Add Move complete"<<std::endl;
                }
            }
        }
}
void M_class::add_move(period* x,int i,period* y,int j,ant_colony* colony){
    //std::cout<<"Inside Add_move"<<std::endl;
    //std::cout<<"Line 1"<<y->period_name<<"\t"<<i<<std::endl;
    long N__y__i = y->ants.at(i);
    //std::cout<<"Line 2"<<std::endl;
    long N__x__j = x->ants.at(j);
    //std::cout<<"Line 3"<<std::endl;
    long N__y__j = y->ants.at(j);
    //std::cout<<"Line 4"<<std::endl;
    long N__x__i = x->ants.at(i);
    //std::cout<<"Line 5"<<std::endl;
    long S_x_y_i = colony->neighbor_ant_count.at(std::make_pair(x, i)) - N__y__i;
    //std::cout<<"Line 6"<<std::endl;
    long S_y_x_j = colony->neighbor_ant_count.at(std::make_pair(y, j)) - N__x__j;
    //std::cout<<"Line 7"<<std::endl;
    long S_x_y_j = colony->neighbor_ant_count.at(std::make_pair(x, j)) - N__y__j;
    //std::cout<<"Line 8"<<std::endl;
    long S_y_x_i = colony->neighbor_ant_count.at(std::make_pair(y, i)) - N__x__i;
    //std::cout<<"Line 9"<<std::endl;
    long adv = N__y__i * N__y__i + S_x_y_i + N__x__j * N__x__j + S_y_x_j;
    long disAdv = N__y__j * N__y__j + S_x_y_j + S_y_x_i;
    double Trail = x->trails.at(j) + y->trails.at(i) - x->trails.at(i) - y->trails.at(j);
    m* new_Move = new m(y,j,adv,disAdv,Trail);
    //::cout<<"Line 10"<<std::endl;
    if(adv < minAdvVal){
        minAdvVal = adv;
        minAdvMove = new_Move;
    }
    //std::cout<<"Line 11"<<std::endl;
    if(adv > maxAdvVal){
        maxAdvVal = adv;
        maxAdvMove = new_Move;
    }
    //std::cout<<"Line 12"<<std::endl;
    if(disAdv < minDisAdvVal){
        minDisAdvVal = disAdv;
        minDisAdvMove = new_Move;
    }
    //::cout<<"Line 13"<<std::endl;
    if(disAdv > maxDisAdvVal){
        maxDisAdvVal = disAdv;
        maxDisAdvMove = new_Move;
    }
    //std::cout<<"Line 14"<<std::endl;
    if(Trail > maxTrailVal){
        maxTrailVal = Trail;
        maxTrailMove = new_Move;
    }
    if(Trail < minTrailVal){
        minTrailVal = Trail;
        minTrailMove = new_Move;
    }
    move_list.push_back(new_Move);
    //std::cout<<"Add_Move complete "<<std::endl;

}
void update_js(int iterations,int conflicts){
    std::string javascript_update_str = "algorithm_update(" + numberToString(iterations) + "," + numberToString(conflicts) + ")";
    const char* javascript_update_C_str = javascript_update_str.c_str();
    emscripten_run_script(javascript_update_C_str);
}
period* ant_colony::node_to_be_recolored(std::map<period* , int> &coloring){
    std::set<period*> conflicted_nodes;
    for(std::map<period*,std::set<period*> >::iterator itrt = edges.begin() ; itrt != edges.end() ; itrt++){
        period* node = itrt->first;
        for(period* neighbor_node:itrt->second)
            if(coloring.at(node) == coloring.at(neighbor_node)){
                conflicted_nodes.insert(period::id_to_period_lookup.at(node->period_id - node->period_len_value));
                break;
            }
    }
    std::set<period*>::iterator itrt = conflicted_nodes.begin();
    std::advance(itrt,random_number(0,conflicted_nodes.size()));
    return *itrt;
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
void ant_colony::dsatur_color(std::map<period* , int> &coloring,std::set<std::pair<std::pair<int,int>,period* > > hlpr_data_structure_zero,std::map<period*,int> hlpr_data_structure_one,int** neighbor_color_counter){
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
            coloring.at(siblingNode) = color;
            for(period* neighbor_node : edges.at(siblingNode)){
                neighbor_color_counter[neighbor_node->period_id][color]++;
                int saturation_of_neighbor = hlpr_data_structure_one.at(neighbor_node);
                hlpr_data_structure_one.at(neighbor_node)++;
                if(hlpr_data_structure_zero.find(std::make_pair(std::make_pair(saturation_of_neighbor,edges.at(neighbor_node).size()),neighbor_node)) == hlpr_data_structure_zero.end())
                    continue;
                hlpr_data_structure_zero.erase(hlpr_data_structure_zero.find(std::make_pair(std::make_pair(saturation_of_neighbor,edges.at(neighbor_node).size()),neighbor_node)));
                hlpr_data_structure_zero.insert(std::make_pair(std::make_pair(saturation_of_neighbor+1,edges.at(neighbor_node).size()),neighbor_node));
            }
        }
        for(int len=0 ; len < node->parent_lecture->lecture_length ; len++){
            period* siblingNode =  period::id_to_period_lookup.at(node->period_id+len);
            hlpr_data_structure_zero.erase(std::make_pair(std::make_pair(hlpr_data_structure_one.at(siblingNode),edges.at(siblingNode).size()),siblingNode));
            //hlpr_data_structure_one.erase(siblingNode);
        }
    }
}
void ant_colony::create_ants(){
    for(std::map<int,period*>::iterator it = period::id_to_period_lookup.begin() ; it != period::id_to_period_lookup.end() ; it++)
        for(int color = 0 ; color < periodsPerDay*numberOfDays ; color++)
            neighbor_ant_count.insert(std::make_pair(std::make_pair(it->second,color),0));
    for(std::map<int,period*>::iterator itrt = period::id_to_period_lookup.begin() ; itrt != period::id_to_period_lookup.end() ; itrt++){
        for(int color:itrt->second->viable_colors){
            itrt->second->ants.insert(std::make_pair(color,periodsPerDay*numberOfDays));
            itrt->second->trails.insert(std::make_pair(color,1.0));
            for(period* neighbor_node:edges.at(itrt->second))
                neighbor_ant_count.at(std::make_pair(neighbor_node,color)) += periodsPerDay*numberOfDays;
        }
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
m::m(period* y,int color,long adv,long disAdv,double Trail){
    this->y = y;
    this->color = color ;
    this->adv = adv;
    this->disAdv = disAdv;
    this->Trail = Trail;
}
M_class::M_class(){
    maxAdvMove = nullptr;
    maxDisAdvMove = nullptr;
    minAdvMove = nullptr;
    minDisAdvMove = nullptr;
    minTrailMove = nullptr;
    maxTrailMove = nullptr;

    maxTrailVal = -DBL_MAX;
    maxAdvVal = LONG_MIN;
    maxDisAdvVal = LONG_MIN;
    minTrailVal = DBL_MAX;
    minAdvVal = LONG_MAX;
    minDisAdvVal = LONG_MAX;
}
M_class::~M_class(){
    for(m* move : move_list)
        delete move;
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