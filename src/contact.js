// import Form from "./form";
const Form = require('./form')

const rootNode = document.getElementById('root');//getting element from the doc
const root = ReactDOM.createRoot(rootNode);//creating react dom

root.render(<Form/>)//any component needed to be rendered here