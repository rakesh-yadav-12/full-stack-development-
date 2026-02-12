let a= prompt("Enter first number")

let b= prompt("Enter second number")

let x=1;
let sum = parseInt(a)+parseInt(b)
function main(){
    try{
        console.log("The sum is ", sum*x)
    return true
    } catch(error){
        console.log("Error aa gaya bhai")
        return false
    }
  finally{

      console.log("files are being closed and db connection is being closed")
  }
    
}

main()
