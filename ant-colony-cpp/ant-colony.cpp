#include "ant-colony.h"
#include <cfloat>
#include <climits>
#include <cmath>
#include <iterator>
#include <utility>

int random_number(int left, int right){
    //returns a number b/w [left,right)
    if(left > right){
        //std::cout<<"Invaid input TO random_number_function\t"<<left<<"\t"<<right<<std::endl;
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
        
    int** neighbor_color_counter = new int*[numberOfPeriods];
    for(int i=0; i<numberOfPeriods ; i++)
        neighbor_color_counter[i] =new int[periodsPerDay*numberOfDays];
    for(int i=0 ; i<numberOfPeriods ; i++)
        for(int j=0 ; j < periodsPerDay*numberOfDays ; j++)
            neighbor_color_counter[i][j] = 0;
    
    dsatur_color(coloring,neighbor_color_counter);
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
    int haha = 10;
    //STEP 6
    while(iterations_without_improvment < MaxIter && least_conflicts > 0){
        //std::cout<<"initiate_coloring\t::\ta and b and c\t::\t starting"<<std::endl;
        //a,b and c (here they happen simultaneously )
        period* X = node_to_be_recolored(coloring);
        //std::cout<<"initiate_coloring\t::\ta and b and c\t::\t X \t"<<X->period_name<<std::endl;
        int i =  coloring.at(X);
        //std::cout<<"initiate_coloring\t::\ta and b and c\t::\t i"<<i<<std::endl;
        int N_i = X->ants.at(i);
        //std::cout<<"initiate_coloring\t::\ta and b and c\t::\t N_i"<<N_i<<std::endl;
        M_class M; //y , j
        //std::cout<<"initiate_coloring\t::\ta and b and c\t::\t calling fill_M"<<std::endl;
        fill_M(M,tabu_table,X,i);
        //std::cout<<"initiate_coloring\t::\ta and b and c\t::\t sorting M"<<std::endl;
        M.sort();

        //std::cout<<"initiate_coloring\t::\td and e\t::\t starting"<<std::endl;
        //d and e
        int p =  X->ants.at(i);
        std::set<int> C_x;
        std::map<period*,std::set<int>> P_x; 
        //the above three are used for trail update 
        for(int move_counter = 0 ; X->ants.at(i) ; move_counter++){
            m* move = M.move_list.at(move_counter);
            period* y = move->y;
            int j = move->color;

            C_x.insert(j);
            P_x[y].insert(j);

            int no_of_ant_exchange = std::min(X->ants.at(i),y->ants.at(j));
            X->ants.at(i) -= no_of_ant_exchange;
            X->ants.at(j) += no_of_ant_exchange;
            for(period* X_adjacent : edges.at(X)){
                neighbor_ant_count.at(std::make_pair(X_adjacent, i)) -= no_of_ant_exchange;
                neighbor_ant_count.at(std::make_pair(X_adjacent, j)) += no_of_ant_exchange;
            }
            y->ants.at(i) += no_of_ant_exchange;
            y->ants.at(j) -= no_of_ant_exchange;
            for(period* y_adjacent : edges.at(y)){
                neighbor_ant_count.at(std::make_pair(y_adjacent, i)) += no_of_ant_exchange;
                neighbor_ant_count.at(std::make_pair(y_adjacent, j)) -= no_of_ant_exchange;
            }
        }

        //for some reason the paper says f,g need to happen here
        //that's counter intuitive
        //also my own experiments show it doesn't work

        //std::cout<<"initiate_coloring\t::\th\t::\t starting"<<std::endl;
        //h creating A
        {
            std::set<period*> A;
            //conflicting vertices at t-1
            node_to_be_recolored(A,coloring);
            //vertices involved in a move
            for(std::map<period*,std::set<int>>::iterator itrt = P_x.begin() ; itrt != P_x.end() ; itrt++)
                A.insert(period::id_to_period_lookup.at(itrt->first->period_id - itrt->first->period_len_value));

            for(period* node : A){
                int color = coloring.at(node);
                coloring.at(node) = -1;
                for(auto neighbor_node : edges.at(node)){
                    neighbor_color_counter[neighbor_node->period_id][color]--;
                }
            }
        }

        //std::cout<<"initiate_coloring\t::\ti\t::\t starting"<<std::endl;
        //i 
        dsatur_color(coloring,neighbor_color_counter);
        conflicts = this->conflicts(coloring);

        //std::cout<<"initiate_coloring\t::\tf\t::\t starting"<<std::endl;
        //f pheramon update
        {
            double maxTrail = -DBL_MAX, minTrail = DBL_MAX;
            std::pair<double,double> rho__deltaT;
            double Delta;
            if(conflicts > least_conflicts)
                Delta = 0.1;
            else if(conflicts == least_conflicts)
                Delta = 0.2;
            else
                Delta = 0.4;
            for(std::map<int,period*>::iterator it = period::id_to_period_lookup.begin() ; it != period::id_to_period_lookup.end() ; it++){
                for(const int color : it->second->viable_colors){
                    if(it->second == X){
                        if(C_x.find(color) != C_x.end())
                            rho__deltaT = std::make_pair(0.9,2*Delta);
                        else if (color == i)
                            rho__deltaT = std::make_pair(0.8, 0);
                        else
                            rho__deltaT = std::make_pair(0.9, 0);
                    }else if (P_x.find(it->second) != P_x.end()){
                        if(P_x.at(it->second).find(color) != P_x.at(it->second).end())
                            rho__deltaT = std::make_pair(0.9, 0);
                        else if(color == i)
                            rho__deltaT = std::make_pair(0.9, Delta);
                        else
                            rho__deltaT = std::make_pair(0.9, Delta/2);
                    }else
                        rho__deltaT = std::make_pair(0.99,0);
                    
                    it->second->trails.at(color) = rho__deltaT.first * it->second->trails.at(color) + rho__deltaT.second;

                    if(it->second->trails.at(color) < minTrail)
                        minTrail = it->second->trails.at(color);
                    if(it->second->trails.at(color) > maxTrail)
                        maxTrail = it->second->trails.at(color);
                }
            }
            if(minTrail != maxTrail)
                for(std::map<int,period*>::iterator it = period::id_to_period_lookup.begin() ; it != period::id_to_period_lookup.end() ; it++)
                    for(const int color : it->second->viable_colors)
                        it->second->trails.at(color) = (it->second->trails.at(color) - minTrail) / (maxTrail - minTrail); 

            //std::cout<<maxTrail <<"\t"<<minTrail<<std::endl;

        }

        //g tabu tenure
        {
            int tab = random_number(0, 10) + floor(0.6f * conflicts);
            std::vector<std::map<std::pair<period*,int>,int>::iterator> tabu_complete;
            for(std::map<std::pair<period*,int>,int>::iterator itrt = tabu_table.begin() ; itrt != tabu_table.end() ; itrt++){
                itrt->second--;
                if(itrt->second <= 0)
                    tabu_complete.push_back(itrt);
            }
            //std::cout<<"initiate_coloring\t::\tg tabu tenure\t::\ttabu_complete filled"<<std::endl;
            
            for(std::map<std::pair<period*,int>,int>::iterator itrt : tabu_complete)
                tabu_table.erase(itrt);
            
            //std::cout<<"initiate_coloring\t::\tg tabu tenure\t::\ttabu_complete emptied"<<std::endl;
            
            tabu_table.insert(std::make_pair(std::make_pair(X,i),tab));
            //std::cout<<"initiate_coloring\t::\tg tabu tenure\t::\tX and i inserted"<<std::endl;
        }

        //j
        if(conflicts < least_conflicts)
        {
            best_coloring = coloring;
            iterations_without_improvment = -1;
            least_conflicts = conflicts;
        }

        //k
        iterations_without_improvment++;
        iterations++;
    }
    std::cout<<"Coloring performed successfully"<<std::endl;
    if(coloring_valid(coloring))
        std::cout<<"COLORING VALID"<<std::endl;
    else{
        std::cout<<"COLORING INVALID"<<std::endl;
        return;
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
    //std::cout<<"maxAdvVal "<<maxAdvVal << "\tminAdvVal "<<minAdvVal<<"\tminDisAdvVal "<<minDisAdvVal<<"\tmaxDisAdvVal "<<maxDisAdvVal<<std::endl;
    //std::cout<<"maxGr " << maxGr << "\tminGr "<<minGr<<"\tminTrailVal "<<minTrailVal<<"\tmaxTrailVal "<<maxTrailVal<<std::endl;
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
        //std::cout<<"normalised_Adv_l "<<normalised_Adv_l<<"\tnormalised_DisAdv_l "<<normalised_DisAdv_l<<"\tnormalised_GR_l "<<normalised_GR_l<<"\tnrml_trail_l "<<nrml_trail_l<<std::endl;
        //std::cout<<i<<"\t"<<left_fitness<<std::endl;
    }
}
void ant_colony::dsatur_color(std::map<period* , int> &coloring,int** neighbor_color_counter){
    std::map<period*,int> saturation_counter; //at any given tells the saturation of any node
    std::set<period*> A;
    for(std::map<period* , int>::iterator itrt = coloring.begin() ; itrt != coloring.end() ; itrt++)
        saturation_counter.insert(std::make_pair(itrt->first, 0));
    for(std::map<period* , int>::iterator itrt = coloring.begin() ; itrt != coloring.end() ; itrt++)
        if(itrt->second == -1){
            for(period* neighbor_node : edges.at(itrt->first))
                saturation_counter.at(neighbor_node)++;
            A.insert(period::id_to_period_lookup.at(itrt->first->period_id - itrt->first->period_len_value));
        }
    while(!A.empty()){
        period* node = nullptr;
        int saturation_degree = INT_MIN , degree = INT_MIN;
        for(period* period_ : A){
            if(saturation_counter.at(period_) > saturation_degree){
                node = period_;
                saturation_degree = saturation_counter.at(period_);
                degree = edges.at(node).size();
            }
            else if(saturation_counter.at(period_) == saturation_degree && edges.at(period_).size() > edges.at(node).size()){
                node = period_;
                degree = edges.at(period_).size();
            }
        }
        int color{-1} , no_of_ants_{INT_MIN} , conflicts{INT_MAX};
        for(int viable_color : node->viable_colors){
            if(node->ants.at(viable_color) > 0){
                if(neighbor_color_counter[node->period_id][viable_color] < conflicts){
                    conflicts = neighbor_color_counter[node->period_id][viable_color];
                    no_of_ants_ = node->ants.at(viable_color);
                    color = viable_color;
                } else if(neighbor_color_counter[node->period_id][viable_color] == conflicts && node->ants.at(viable_color) > no_of_ants_){
                    color = viable_color;
                    no_of_ants_ = node->ants.at(viable_color);
                }
            }
        }
        for(int len = 0 ; len < node->parent_lecture->lecture_length ; len++){
            //std::cout<<period::id_to_period_lookup.at(node->period_id + len)->period_name<<std::endl;
            coloring.at(period::id_to_period_lookup.at(node->period_id + len)) = color + len;
            for(period* neighbor_node : edges.at(node)){
                saturation_counter.at(neighbor_node)++;
                neighbor_color_counter[neighbor_node->period_id][color+len]++;
            }
        }
        //std::cout<<std::endl;
        A.erase(node);
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
void ant_colony::node_to_be_recolored(std::set<period*> &A,std::map<period* , int> &coloring){
    for(std::map<period*,std::set<period*> >::iterator itrt = edges.begin() ; itrt != edges.end() ; itrt++){
        period* node = itrt->first;
        for(period* neighbor_node:itrt->second)
            if(coloring.at(node) == coloring.at(neighbor_node)){
                A.insert(period::id_to_period_lookup.at(node->period_id - node->period_len_value));
                break;
            }
    }
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