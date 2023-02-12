const users = document.querySelector(".table-body")
const newData = {
    method: 'GET',
    headers: {
        'Content-Type': "application/json"
            // "authorization": `Bearer ${token}`
    }
}
console.log(newData)
fetch("http://localhost:6500/api/getAllUsers", newData)
    .then(async(n) => {
        const res = await n.json()
        console.log(res)

        res.forEach(user => {
            users.innerHTML += `
        
            <tr>

                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td>${user.password}</td>
                            <td>${user.repeatPassword}</td>
                        </tr>
            `
        })


    })