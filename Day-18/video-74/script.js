let button = document.getElementById("btn")
button.addEventListener("dblclick", ()=>{
   document.querySelector(".box").innerHTML = "<b>Yayy you were clicked</b> Enjoy your click!"
})

button.addEventListener("contextmenu", ()=>{
  alert("Dont hack us by Right click Please")
})

document.addEventListener("keydown", (e)=>{
   console.log(e)
})