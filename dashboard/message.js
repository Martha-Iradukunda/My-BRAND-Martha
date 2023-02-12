const messages = document.querySelector(".table-body")
const newData = {
    method: 'GET',
    headers: {
        'Content-Type': "application/json"
            // "authorization": `Bearer ${token}`
    }
}
console.log(newData)
fetch("http://localhost:6500/api/messages", newData)
    .then(async(n) => {
        const res = await n.json()
        console.log(res)

        res.forEach(message => {
            messages.innerHTML += `
        
            <tr>
             <td>${message.email}</td>
             <td>${message.fname}</td>
             <td>${message.lname}</td>
            <td>${message.message}</td>
             </tr>
            `
        })


    })