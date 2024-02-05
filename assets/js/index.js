$("#add_user").submit(function(event){ // use to render the browser when we click the submit button
  alert("Data Inserted Successfully!")
})

$("#update_user").submit(function(event){ 
  event.preventDefault(); //-> preventDefault will change the default behaviour of this form or stop the def behaviour

  var unindexed_array = $(this).serializeArray();
  var data = {}

  $.map(unindexed_array,function(n,i){
    data[n['name']] = n['value']
  })

  console.log(data);

  var request = {
    "url":`http://localhost:3000/api/users/${data.id}`,
    "method":"PUT",
    "data":data
  }

  $.ajax(request).done(function(respoonse){
    alert("Data Updated Successfully")
  })
}) 


if (window.location.pathname == "/") {
  $ondelete = $(".table tbody td a.delete")
  $ondelete.click(function(){
    var id = $(this).attr("data-id")

    var request = {
      "url":`http://localhost:3000/api/users/${id}`,
      "method":"DELETE" 
    }

    if (confirm("Do you really want to delete this record?")) {
      $.ajax(request).done(function(respoonse){
        alert("Data Deleted Successfully")
        location.reload()
      })
    }
  })
}