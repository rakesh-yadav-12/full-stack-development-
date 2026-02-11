function createCard(title, cName, views, monthsOld, duration,thumbnail){

    // Finsh this function
    if(views<1000000)
    {
     viewStr = views/1000 + " K";
    }
    else if(views>1000000)
    {
     viewStr = views/1000000 + " M";
    }
    else{
        viewStr = views/1000 + " K";
    }
    let html =`<div class="card">
            <div class="image">
                <img src="${thumbnail}" alt="">
                <div class="capsule"></<div>
            </div>
            <div class="text">
                <h1>${title}</h1>
                <p>${cName} . ${viewStr} views .${monthsOld} months ago</p>
            </div>

        </div>`

}

createCard("Introduction to Backend | Sigma web dev bideo #2", "codewithHarry", 56000, 7, "31:22", "https://i.ytimg.com/vi/7AgEjgUtho4/hqdefault.jpg?sqp=-oaymwEmCKgBEF5IWvKriqkDGQgBFQAAiEIYAdgBAeIBCggYEAIYBjgBQAE=&rs=AOn4CLD5k1xvazrjSCkigB_ORxezpivKng")