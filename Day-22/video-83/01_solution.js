let students =["shubh", "anajali","kajal","suhani","annapurna"
    ,"shubham","krishnaedu","ravindranathan", "shivesh","kaif","emanue"
]

let houses= []

for(const student of students){
    if(student.length< 6){
        houses.push("Gryffindor")
    }
    else if(student.length<8){
        houses.push("Hufflepuff" )   
    
        }
        else if(student.length<10){
            houses.push("Ravenclaw")
        }
        else{
            houses.push("Slytherin")
        }
    
    }

    console.log(houses)
