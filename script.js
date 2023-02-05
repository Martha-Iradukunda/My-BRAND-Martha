 var allusers = localStorage.getItem("users");
 if (allusers == null) {
     allusers = []
 } else {
     allusers = JSON.parse(allusers)


 }
 var logIn = document.querySelector("a[href*='login.html']")
 var signUp = document.querySelector("a[href='signup.html']")
 console.log(logIn)
 var currentuser = localStorage.getItem("user");
 if (currentuser != null) {
     currentuser = JSON.parse(currentuser)
     if (logIn != null) {
         logIn.innerText = "LOGOUT";
         logIn.addEventListener("click", event => {
             event.preventDefault()
             localStorage.removeItem("user")
             window.location.assign("/")


         })

     }
     if (signUp != null) {
         signUp.remove();
     }
 }


 //LOGIN

 function myfunction() {
     var x = document.getElementById("pass");

     if (x.type === "password") {
         x.type = "text";
     } else {
         x.type = "password";
     }
 }

 function validate() {
     var password = document.getElementById("pass");
     var userrname = document.getElementById("username");
     var user = allusers.filter(each => each.name == userrname.value)[0]


     var length = document.getElementById("length");

     if (user != null && password.value.length >= 8 && userrname.value.length >= 5 && password.value == user.password) {
         alert("Login Succesfull");
         localStorage.setItem("user", JSON.stringify(user))
         window.location.replace("index.html");
         return false;
     } else {
         alert("Login Failed");
     }
 }
 // Sign Up page
 function myfunctionUP() {
     var y = document.getElementById("pass1");

     if (y.type === "password") {
         y.type = "text";
     } else {
         y.type = "password";
     }
 }

 function validateUp() {
     var password = document.getElementById("pass1");
     var nameVal = document.getElementById("username1");
     var emailVal = document.getElementById("email1");
     var pwdTwoVal = document.getElementById("pwdTwoSignUp");


     var length = document.getElementById("length");

     if (password.value.length >= 8 && nameVal.value.length >= 5) {
         signupFuncion();
         alert("Acccount created successfully");
         return false;
     } else {
         alert("Account not created!");
     }
 }

 //LOCALSTORAGE

 function signupFuncion() {
     nameValue = document.getElementById("username1").value;
     emailValue = document.getElementById("email1").value;
     pwdValue = document.getElementById("pass1").value;
     pwdTwoValue = document.getElementById("pwdTwoSignUp").value;



     if (pwdTwoValue.length != 0 && pwdValue.length != 0 && pwdValue == pwdTwoValue) {
         if (nameValue.length != 0 && emailValue.length != 0 && pwdValue.length >= 8) {
             const user = {
                 name: nameValue,
                 email: emailValue,
                 password: pwdValue
             }
             localStorage.setItem("user", JSON.stringify(user));
             allusers.push(user)
             localStorage.setItem("users", JSON.stringify(allusers));

             let newObject = localStorage.getItem("user");
             console.log(JSON.parse(newObject));
             alert("name:" + JSON.parse(newObject).name + ", email:" + JSON.parse(newObject).email + ", password:" + JSON.parse(newObject).password);
         } else {
             alert("Invalid email or password!");
         }
     } else {
         alert("Passwords do not match!");
     }


 }

 //BLOGS

 function createBlog() {
     titleValue = document.getElementById("titleBlog").value;
     bodyValue = document.getElementById("bodyBlog").value;

     if (titleValue.length != 0 && bodyValue.length != 0) {
         var blog = { "title": titleValue, "body": bodyValue, "likes": 0 };

         var result = JSON.parse(localStorage.getItem("blog32") || "[]");
         console.log("result100" + result);
         console.log("result100" + typeof result);
         result.push(blog);


         localStorage.setItem("blog32", JSON.stringify(result));
         titleBlog.value = "";
         bodyBlog.value = "";
         getBlogs();
     } else {
         alert("Invalid title or blog body!");
     }
 }
 // ----------------------coming

 function getBlogs() {
     document.getElementById("blogsDisplay").innerHTML = "";

     var blogs = JSON.parse(localStorage.getItem("blog32") || "[]");

     let blogsDisplay = document.getElementById("blogsDisplay");


     if (blogs != null) {

         blogs.forEach(function(blog, index) {
             let li = document.createElement("li");
             li.innerText = "\n\n\nTitle: " + blog.title + "\nBody: " + blog.body + "\nLikes: " + blog.likes + "\n\n";

             var editbutton = document.createElement("button");
             editbutton.innerHTML = 'Edit ';
             editbutton.onclick = function() {
                 editBlog(blog.title, blog.body);
             };

             var deletebutton = document.createElement("button");
             deletebutton.innerHTML = 'Delete  ';
             deletebutton.onclick = function() {
                 deleteBlog(blog.title);
             };

             var likebutton = document.createElement("button");
             likebutton.innerHTML = 'Like';

             likebutton.onclick = function() {
                 likeABlog(blog.title);
             };

             blogsDisplay.appendChild(li);
             blogsDisplay.appendChild(deletebutton);
             blogsDisplay.appendChild(editbutton);

             //  blogsDisplay.appendChild(likebutton);


         });


     }
 }
 //  admin.html


 function getBlogsViewer() {
     document.getElementById("blogsDisplay").innerHTML = "";

     var blogs = JSON.parse(localStorage.getItem("blog32") || "[]");

     let blogsDisplay = document.getElementById("blogsDisplay");


     if (blogs != null) {

         blogs.forEach(function(blog, index) {
             let li = document.createElement("li");
             li.innerText = "\n\nTitle: " + blog.title + " \nBody: " + blog.body + "\n Likes: " + blog.likes;


             var likebutton = document.createElement("button");
             likebutton.innerHTML = 'Like';
             likebutton.onclick = function() {
                 likeABlog(blog.title);
             };

             blogsDisplay.appendChild(li);
             blogsDisplay.appendChild(likebutton);
         });

     }
 }

 function likeABlog(title) {
     var blogs = JSON.parse(localStorage.getItem("blog32") || "[]");

     blogs.forEach(function(blog, index) {

         if (blog.title == title) {
             likes = parseInt(blog.likes) + 1;
             blog.likes = likes;
             localStorage.setItem("blog32", JSON.stringify(blogs));
         }
     });

     //  getBlogs();
     getBlogsViewer();

 }

 function editBlog(title, body) {
     var modal = document.getElementById("myModal");
     modal.style.display = "block";

     document.getElementById('ediTitleContact').value = title;
     document.getElementById('editBodyBlog').value = body;

     var span = document.getElementsByClassName("close")[0];
     span.onclick = function() {
         modal.style.display = "none";
     }

     // When the user clicks anywhere outside of the modal, close it
     window.onclick = function(event) {
         if (event.target == modal) {
             modal.style.display = "none";
         }
     }

     updateBUtton = document.getElementById('updateButton');

     updateBUtton.onclick = function() {
         console.log("updateBUtton" + updateBUtton);
         ediTitleContact = document.getElementById('ediTitleContact').value;
         editBodyBlog = document.getElementById('editBodyBlog').value;


         var blogs = JSON.parse(localStorage.getItem("blog32") || "[]");

         blogs.forEach(function(blog, index) {

             if (blog.title == title) {
                 blog.title = ediTitleContact;
                 blog.body = editBodyBlog;
                 localStorage.setItem("blog32", JSON.stringify(blogs));
             }
         });

         getBlogs();

         var modal = document.getElementById("myModal");
         modal.style.display = "none";
     };
 }


 function deleteBlog(title) {
     var blogs = JSON.parse(localStorage.getItem("blog32") || "[]");

     blogs.forEach(function(blog, index) {
         console.log("index" + index);

         if (blog.title == title) {
             console.log("index 2" + index);
             blogs.splice(index, 1);
             localStorage.setItem("blog32", JSON.stringify(blogs));
             getBlogs();

         }
     });
 }

 //CONTACT FORM

 function createContact() {
     emailContact = document.getElementById("emailContact").value;
     firstNameContact = document.getElementById("firstNameContact").value;
     lastNameContact = document.getElementById("lastNameContact").value;
     otherNameContact = document.getElementById("otherNameContact").value;
     messageContact = document.getElementById("messageContact").value;

     if (emailContact.length != 0 && firstNameContact.length != 0 && lastNameContact.length != 0 && messageContact.length != 0) {
         var question = { "email": emailContact, "firstname": firstNameContact, "lastname": lastNameContact, "othername": otherNameContact, "message": messageContact };

         var questions = JSON.parse(localStorage.getItem("questions") || "[]");
         questions.push(question);


         localStorage.setItem("questions", JSON.stringify(questions));
         emailContact.value = "";
         firstNameContact.value = "";
         lastNameContact.value = "";
         otherNameContact.value = "";
         messageContact.value = "";
     } else {
         alert("Invalid firstname, lastname, email or question");
     }
 }

 // var questions = JSON.parse(localStorage.getItem("questions") || "[]");



 const sign_in_btn = document.querySelector("#sign-in-btn");
 const sign_up_btn = document.querySelector("#sign-up-btn");
 const container = document.querySelector(".container");

 if (sign_up_btn != null) {
     sign_up_btn.addEventListener("click", () => {

         container.classList.add("sign-up-mode");
     });
 }

 if (sign_in_btn != null) {
     sign_in_btn.addEventListener("click", () => {
         container.classList.remove("sign-up-mode");
     });

 }



 //Local storage
 function setItem() {
     var name = "Marita";
     localStorage.setItem("name", JSON.stringify(name));
 }

 function getItem() {
     var nameTwo = window.localStorage.getItem("name");
     console.log(JSON.parse(nameTwo));
 }


 // local storage for Message from contact form

 function getQuestions() {
     var questions = localStorage.getItem("questions");
     console.log("questions 3: ", questions);

     var table = document.getElementById('content');
     table.innerHTML = "<tr><th>Email Address</th><th>First Name</th><th>Last Name</th><th>Other Name</th><th>Message</th></tr>";

     if (questions != null) {
         questions.forEach(function(question, index) {
             var row = document.createElement('tr');
             var dataEmail = document.createElement('td');
             var textEmail = document.createTextNode(question.email);
             dataEmail.appendChild(textEmail);
             var dataFirstName = document.createElement('td');
             var textFirstName = document.createTextNode(question.firstname);
             dataFirstName.appendChild(textFirstName);
             var dataLastName = document.createElement('td');
             var textLastName = document.createTextNode(record.lastname);
             dataLastName.appendChild(textLastName);
             var dataOtherName = document.createElement('td');
             var textOtherName = document.createTextNode(record.othername);
             dataOtherName.appendChild(textOtherName);
             var dataMessage = document.createElement('td');
             var textMessage = document.createTextNode(record.message);
             dataMessage.appendChild(textMessage);

             row.appendChild(dataEmail);
             row.appendChild(dataFirstName);
             row.appendChild(dataLastName);
             row.appendChild(dataOtherName);
             row.appendChild(dataMessage);
             table.appendChild(row);

         });


     }
 }


 //ACCOUNTS SIGNED UP
 function getSignedupUsers() {
     var users = localStorage.getItem("users");
     console.log("users 3: ", users);

     var table = document.getElementById('contentAccounts');
     table.innerHTML = "<tr><th>Name</th><th>Email</th></tr>";

     if (users != null) {
         users.forEach(function(user, index) {
             var row = document.createElement('tr');
             var dataName = document.createElement('td');
             var textName = document.createTextNode(user.name);
             dataName.appendChild(textName);
             var dataEmail = document.createElement('td');
             var textEmail = document.createTextNode(user.email);
             dataEmail.appendChild(textEmail);

             row.appendChild(dataName);
             row.appendChild(dataEmail);
             table.appendChild(row);
         });
     }
 }