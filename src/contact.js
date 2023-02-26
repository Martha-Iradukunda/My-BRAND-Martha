// import Form from "./form";
////const Form = require('./form');

// const Form = () => {
//     const[responseMessage,setResponse]=React.useState("");
//     const [loading,setLoading]=React.useState(false);
// const [message,SetMessage]=React.useState({
//     "email":"",
//     "fname":"",
//     "lname":"",
//     "description":"",
// });
// const handleChange=async(e)=>{
//     const {name,value}=e.target;
//     // console.log(name,value);
//     SetMessage((state)=>({...state,[name]:value}));
//     const payload={
//         name:message.fname + message.lname,
//         email:message.email,
//         message:message.description,};
//     const res=await fetch ("https://marthairadukunda.cyclic.app/api/messages",{
//         method:"POST",
//         mode:"cors",
//         headers:{
//             'Content-Type': "application/json",
//             token:localStorage.getItem("token"),


//         },
//         body:JSON.stringify(payload),});
//         setLoading(false)
//         const{data}=await res.json();
//         setResponse(data.message);
//     };
// // };
// const handleSubmit=async(e)=>{
//     setLoading(true)
//     e.preventDefault();
//     console.log(message);
//   }
//     const inputs = ["email", "fname", "lname"];
//     return (
//         <div>
//             <p>{responseMessage}</p>
//       <form onSubmit={handleSubmit}>
        
//         {inputs.map((element, index) => {
//           <input key={index}
//            name={element} 
//            placeholder={element} />;
//         })}
// <textarea name="description" onChange={handleChange}></textarea>
// <button disabled={loading}>{loading? "Loading ..." : "Submit"}</button>
// </form>
// <div className="max-width">
//             <div className="contact-content">
//                 <div className="column left">
//                     <div className="text">Get in Touch,</div>
//                     <div className="icons">
//                         <div className="row">
//                             <i className="fas fa-user"></i>
//                             <div className="info">
//                                 <div className="head">Name</div>
//                                 <div className="sub-title">Martha Iradukunda</div>
//                             </div>
//                         </div>
//                         <div className="row">
//                             <i className="fas fa-map-marker-alt"></i>
//                             <div className="info">
//                                 <div className="head">Address</div>
//                                 <div className="sub-title">Rwamagana, Rwanda</div>
//                             </div>
//                         </div>
//                         <div className="row">
//                             <i className="fas fa-envelope"></i>
//                             <div className="info">
//                                 <div className="head">Email</div>
//                                 <div className="sub-title">marthairadukunda1@gmail.com</div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
// </div>
// </div>
// </div>

//     );
//   };

// const rootNode = document.getElementById('root');//getting element from the doc
// const root = ReactDOM.createRoot(rootNode);//creating react dom
// root.render(<Form/>)//any component needed to be rendered here






// const rootNode = document.getElementById('root');//getting element from the doc
//  const root = ReactDOM.createRoot(rootNode);
//  root.render(React.createElement(Form));