const users = document.querySelector(".table-body")
const token = localStorage.getItem("token")
const newData = {
    method: 'GET',
    headers: {
        // 'Content-Type': "application/json",
        "auth_token": token
    }
}
console.log(newData)
fetch("https://marthairadukunda.cyclic.app/api/getAllUsers", newData)
    .then(async(n) => {
        const res = await n.json()
        console.log(res)


        res.allUsers.forEach(user => {
            users.innerHTML += `
        
            <tr>
             <td>${user.username}</td>
             <td>${user.email}</td>
              <td>${user.isVerified}</td>
             <td>${user.role}</td>
             </tr>
            `
        })


    })