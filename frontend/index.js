async function submission(){
    let code = document.querySelector("#codeid");
    let code1 = code.value;
    let lang = "c++";
    try {
      const res = await fetch('./http://localhost:3000/submit' , {
        method : 'POST',
        body : JSON.stringify({
          code : code1,
          language : lang
        })
      });
      if(!res.ok) throw new Error(`HTTP error ! status : ${res.status}`);
      const data = await res.json();
      console.log('submission successful : ' , data);
      alert("Code submitted successfully");
      //display result
    }
    catch (error){
      console.error("error submission code : " , error);
    }
}