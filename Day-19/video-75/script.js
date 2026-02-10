console.log("Rakesh is a hacker")
console.log("Rohan is a hecker")

setTimeout(()=>{
console.log("I am inside settimeout")
},2000);
setTimeout(()=>{
console.log("I am inside settimeout 2")
},2000);

console.log("The End")


const callback =(arg)=>{
    console.log(arg)
}
const loadScript =(src, callback) => {
  let sc =document.createElement("script");
  sc.src = src;
  sc.onload = callback("Harry")
  document.head.append(sc)
}


loadScript("https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js", callback)
