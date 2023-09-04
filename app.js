const express=require('express');
const accountSid = 'AC6744760e5306f5b0db56a20a054884cd';
const authToken = '47589d49cdaa208e0efc6637ffb2df11';
const client = require('twilio')(accountSid,authToken );
var bodyParser = require('body-parser');
const fileUpload=require('express-fileupload')
const cors = require('cors');
const app=express();
app.use(express.static('public'))
const http = require("http");
const fs = require("fs");
const url = require("url");
const bcrypt=require("bcrypt");
app.use(cors());
app.use(fileUpload())
app.use(express.json())
var jsonParser = bodyParser.json();
const {open}=require("sqlite");
const sqlite3=require("sqlite3");
const path=require("path");
const jwt=require("jsonwebtoken");
const { error, Console } = require('console');
const { runInNewContext } = require('vm');
const dbPath=path.join(__dirname,"sqLiteDBusers.db");
console.log(dbPath)
let db=null;
// const express = require('express');
const PORT = 9000;
var t = '/sceneImages';
// app.use(express.static('public'));
app.use('/images', express.static('uploads'));
app.use(`${t}`, express.static('sceneImages'));
app.use('/mapImages', express.static('mapImages'));
app.use('/virtualThumbnails', express.static('virtualThumbnails'));
app.use('/feedUploads', express.static('feedUploads')); 
app.use('/uploads', express.static('uploads'));  
app.use('/vendorProducts', express.static('vendorProducts'));   
app.use('/spaces', express.static('spaces'));  

// Server setup
initilaizeDBAndServer=async()=>{
    try{
    db=await open({
        filename:dbPath,
        driver:sqlite3.Database
    });
    app.listen(9000,()=>{
    console.log("server is running");
    });
}
    catch(e){
        console.log(e.message)
        process.exit(1)
    }
}
initilaizeDBAndServer()
//get users


app.get("/users/", async (request,response)=>{
    const {id}=request.params
    const userDetails=`SELECT * FROM users`;
    const userDetailQuery=await db.all(userDetails);
    response.send(userDetailQuery);
})
//post desigener users
app.post("/register1/",jsonParser,async(request,response)=>{
      const userDetails = request.body;
      const {email,phone,fullName,userName,password}=userDetails
      const bcryptedPassword=await bcrypt.hash(password,10);
      const selectUsername=`SELECT * FROM users WHERE user_name = '${userName}' ;`;
      const existingUser=await db.get(selectUsername);
     
      if(existingUser=== undefined ){
        const userDBAuery=`INSERT INTO users(email,phone,full_name,user_name,password)
        VALUES('${email}','${phone}','${fullName}','${userName}','${bcryptedPassword}');`;
        const dbResponse=await db.run(userDBAuery)
        const userId=dbResponse.lastID
        response.send("user created Successfully!");
      }
      else{
        response.send("User already exist")
        response.status(400)
      }
})
//desigener user login API
app.post("/login/",jsonParser,async(request,response)=>{
  const userAuthentication=request.body
  const {username,password}=userAuthentication;
  const selectQuery=`SELECT * FROM users WHERE user_name = '${username}';`
  const authentiatedUser=await db.get(selectQuery)
  if(authentiatedUser===undefined){
    response.status(400)
    response.send({error_msg:"Invalid User"})
  }
  else{
    const isPasswordMatched=await bcrypt.compare(password,authentiatedUser.password)
    if(isPasswordMatched===true){
      const payload={username:username}
     const jwt_token= jwt.sign(payload,"ferewrw")
     response.send(JSON.stringify(jwt_token))
    }  
    else{
      response.status(400)
      response.send("Invalid Password")
    }
  }
})
// house owner user post
let globalHouseOwnerId=null
app.post("/houseOwner/registration",jsonParser,async(request,response)=>{
  const houseownerDetails=request.body
  const {email,number,fullName,userName,password}=houseownerDetails
 const bcryptedPassword1=await bcrypt.hash(password,10)
  const selectUserQuery=`SELECT * FROM house_owners_details WHERE user_name ='${userName}';`;
 const userQueryResponse=await db.get(selectUserQuery)



 if(userQueryResponse===undefined){
  const detailsInsertQuery=`INSERT INTO house_owners_details(email,number,full_name,user_name,password)
  VALUES('${email}','${number}','${fullName}','${userName}','${bcryptedPassword1}');`;
  const dbResponse=await db.run(detailsInsertQuery)
  const houseownsrId=await dbResponse.lastID
  globalHouseOwnerId=houseownsrId
  console.log(globalHouseOwnerId)
  response.send(JSON.stringify("User Created Successfully"))
 }

 else if(userQueryResponse.email===email){
  response.send(JSON.stringify("email is Already exist"))
  response.status(400)
 }
 else if(userQueryResponse.number===number){
  response.send(JSON.stringify("Mobile Number is Already exist"))
  response.status(400)
 }
 else if(userQueryResponse.user_name===userName){
  response.send(JSON.stringify("user name is Already exist"))
  response.status(400)
 }

})
//houseowner login API
app.post("/houseowner/login",jsonParser,async(request,response)=>{
  const loginDetails=request.body
  const {username,password}=loginDetails
  const loginQuery=`SELECT * FROM house_owners_details WHERE user_name='${username}';`;
  const dbResponse=await db.get(loginQuery)
  if(dbResponse===undefined){
    response.status(400)
    response.send({error_msg:"Invalid User"})

  }
  else{
    const comparePassword=await bcrypt.compare(password,dbResponse.password)
    if(comparePassword===true){
      const payload={username:username};
      const jwt_token= jwt.sign(payload,"dgterter");
      response.send({jwt_token});
    }
    else{
      response.status(400)
      response.send({error_msg:"password invalid"})
    }
  }
})
//Design information 
app.post("/propertyInfo/",jsonParser,async(request,response)=>{
  const propertyDetails=request.body;
  const {propertyType,residentialType,service,occupancy,status,category,area1,measurement,locality,city,timeDuration}=propertyDetails
  const insertingPropertyDetails=`INSERT INTO property_details(property_type,residential_type,service,occupancy,status,category,project_area,measurement,locality,city,time_duration,user_id)
  VALUES('${propertyType}','${residentialType}','${service}','${occupancy}','${status}','${category}','${area1}','${measurement}','${locality}','${city}','${timeDuration}','${globalHouseOwnerId}');`;
  const dbResponse=await db.run(insertingPropertyDetails)
  response.send(JSON.stringify("submitted Successfully"))
})

//individual designer registration(signup)
app.post("/designer/signup/",jsonParser,async(request,response)=>{
  const desigenerLogo=request.files
  const desigenerDetails= request.body


  const {name,address,email,area,budget,bankName,accountNumber,branch,ifscCode,PhoneNumber,logoFile}=desigenerDetails
 if (desigenerLogo===null){
  let filePath=""
  const selectUser=`SELECT * FROM interior_designer_details WHERE phone_number = '${PhoneNumber}';`;
  const dbResponse=await db.get(selectUser);
  console.log(dbResponse,"searching")

 if(dbResponse===undefined){

  const designerSignupQuery=`INSERT INTO interior_designer_details (desigener_name,email_id,phone_number,area,logo,budget,bank_name,account_number,branch,ifsc_code,address,number_of_posts,number_of_followers,number_of_following)
  VALUES('${name}','${email}','${PhoneNumber}','${area}','${filePath}','${budget}','${bankName}','${accountNumber}','${branch}','${ifscCode}','${address}',0,0,0);`;
  const dbResponse=await db.run(designerSignupQuery)
  response.send("User is created Successfully")
  console.log(dbResponse ,"lastId")
 }




 else{
  response.send("user is already existed with this Mobile number")
  response.status(400)
  console.log("user is already existed with this Mobile number")
 }
 }
 else{
  const fileName=Date.now()+"_"+request.files.logoFile.name
  const file=request.files.logoFile
  const filePath="uploads/"+fileName
  file.mv(filePath,async(error)=>{
    if(error){
      return(response.send(error))
    }
  })
  const selectUser=`SELECT * FROM interior_designer_details WHERE phone_number = '${PhoneNumber}';`;
  const dbResponse=await db.get(selectUser);
  console.log(dbResponse,"searching")
 if(dbResponse===undefined){
  const designerSignupQuery=`INSERT INTO interior_designer_details (desigener_name,email_id,phone_number,area,logo,budget,bank_name,account_number,branch,ifsc_code,address,number_of_posts,number_of_followers,number_of_following)
  VALUES('${name}','${email}','${PhoneNumber}','${area}','${filePath}','${budget}','${bankName}','${accountNumber}','${branch}','${ifscCode}','${address}',0,0,0);`;
  const dbResponse=await db.run(designerSignupQuery)
  response.send("User is created Successfully")
  console.log(dbResponse ,"lastId")
 }
 else{
  response.send("user is already existed with this Mobile number")
  response.status(400)
  console.log("user is already existed with this Mobile number")
 }
}
  
})
//file upload
//login with otp
app.post("/checkingPhonenumbers/",jsonParser,async(request,response)=>{
  const phone=request.body
  const {phoneNumber}=phone
  console.log(phoneNumber)
  dbQuery=`SELECT * FROM interior_designer_details WHERE phone_number='${phoneNumber}';`;
  const dbResponse=await db.get(dbQuery)
  console.log(dbResponse)
  if(dbResponse===undefined){
    console.log(dbResponse ,"iffff")
    response.status(404)
    response.send({"error_msg":"Mobile number is not Registered"})
    
    
  }
  else{
    console.log(dbResponse,"elseee")
    //creating jsonweb token
    const payload={phoneNumber:phoneNumber,}
    const jwtToken=jwt.sign(payload,"designer_login_token")
    response.send({jwtToken})
    console.log({jwtToken},phoneNumber)
    
  }
  // const response1=`SELECT * FROM interior_designer_details WHERE phone_number='${phone}';`;
  // const dbResponse=await db.get(response1)
  // console.log(dbResponse)

})

//middleware function 

const jwtAuthenticateToken=(request,response,next)=>{
  let jwtToken;
 
  const authHead=request.headers["authorization"]
  if(authHead!== undefined){
  jwtToken=authHead.split(" ") [1];
  }
  if(jwtToken===undefined){
    response.status(401)
    response.send(JSON.stringify("Unauthorized User"))
  }
  else{
    jwt.verify(jwtToken,"designer_login_token",(error,payload)=>{
      if(error){
        response.status(401)
        response.send(JSON.stringify("Invalid Access Token"))
      }
      else{
        request.userNumber=payload.phoneNumber       
        next()
      }
    })
  }
}
const userJwtAuthenticateToken=(request,response,next)=>{
  let jwtToken;
 
  const authHead=request.headers["authorization"]
  if(authHead!== undefined){
  jwtToken=authHead.split(" ") [1];
  }
  if(jwtToken===undefined){
    response.status(401)
    response.send(JSON.stringify("Unauthorized User"))
  }
  else{
    jwt.verify(jwtToken,"user_login_token",(error,payload)=>{
      if(error){
        response.status(401)
        response.send(JSON.stringify("Invalid Access Token"))
      }
      else{
        request.userNumber=payload.phoneNumber  
           
        next()
      }
    })
  }
}
const vendorJwtAuthenticateToken=(request,response,next)=>{
  let jwtToken;
 
  const authHead=request.headers["authorization"]
  if(authHead!== undefined){
  jwtToken=authHead.split(" ") [1];
  }
  if(jwtToken===undefined){
    response.status(401)
    response.send(JSON.stringify("Unauthorized User"))
  }
  else{
    jwt.verify(jwtToken,"vendorLoginToken",(error,payload)=>{
      if(error){
        response.status(401)
        response.send(JSON.stringify("Invalid Access Token"))
      }
      else{
        request.userNumber=payload.phoneNumber  
           
        next()
      }
    })
  }
}
 // sending invitation by sms to Interior Desigener
app.post("/invitationApi",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const inviationDetails=request.body
  const {userNumber}=request
  const {mobileNumber,invitationMsg}=inviationDetails
  const selectUser=`SELECT receiver_number FROM invitation_data WHERE receiver_number='${mobileNumber}';`;
  const getDbResponse=await db.get(selectUser);
  console.log(getDbResponse)
  const checkWithDesignerTable=`SELECT phone_number FROM interior_designer_details WHERE phone_number='${mobileNumber}';`;
  const responseDesignerTable=await db.get(checkWithDesignerTable);
  console.log(getDbResponse)
    const invitationDetails=`INSERT INTO invitation_data (sender_number, receiver_number)
VALUES ('${userNumber}','${mobileNumber}' )`;
const sendingInvitation=await db.run(invitationDetails)
client.messages
.create({
   body:invitationMsg,
   from: +14849897515,
   to:`+91${mobileNumber}`
 })
.then(message =>response.send(JSON.stringify("Invitation Sent Successfully")))
.catch(error =>
  console.log(error)
);



})
app.post("/createPost",jwtAuthenticateToken,jsonParser,(request,response)=>{
  const hello=request.body
  console.log(hello)



})
app.post("/post/",jsonParser,jwtAuthenticateToken,async(request,response)=>{
  const file=request.files.multipleUploadImage
  const fileName=Date.now()+"_"+request.files.multipleUploadImage.name
  const filePath=`feedUploads/${fileName}`;
  console.log(filePath)
  file.mv(filePath,async(error)=>{
   if(error){
      return(response.send(error))
   }
   else{
  const {userNumber}=request
  const selectUserId=`SELECT desigener_name from interior_designer_details WHERE phone_number='${userNumber}';`;
  const dbResponse=await db.get(selectUserId);
  console.log(dbResponse.desigener_name,"gytyuty");
  const feedDetails=request.body;
  // const fileUrl = `http://13.233.231.34:9000/${filePath}`;
  const {description,property,subType,Occupancy,Category,DesignStyle,Locality,city,privacy}=feedDetails;
  const feedInsertQuery=`INSERT INTO feed_details(feed_images,description,property_type,property,occupancy,category,design_style,locality,city,user_id,privacy)
  VALUES('${filePath}','${description}','${property}','${subType}','${Occupancy}','${Category}','${DesignStyle}','${Locality}','${city}','${dbResponse.desigener_name}','${privacy}');`;
  const dbResonse=await db.run(feedInsertQuery)


  // res.json({ message: 'Feed is uploaded successfully', fileUrl });


  response.send(JSON.stringify("Feed is uploaded successfully"));
  console.log(dbResonse);     
    }
   })
})
//edit profile/ create profile
app.post("/editProfile",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const profileDetails=request.body
  const {username,email,phoneNumber,companyName,location}=profileDetails
  const checkingProfile=`SELECT phone_number FROM designer_profile_details where phone_number='${phoneNumber}';`;
  console.log(checkingProfile)
  const dbChecking =await db.get(checkingProfile)
  if(dbChecking===undefined){
  const file=request.files.profileImages
 const fileName=Date.now()+"_"+file.name
 const filePath=__dirname+"/profileImages/"+fileName
 file.mv(filePath,async(error)=>{
  if(error){
    console.log(error)
  }


 })
  console.log(request.body)
  
  const profileInsertQuery=`INSERT INTO designer_profile_details(user_name,email,phone_number,company_name,location,number_of_posts,number_of_followers,number_of_following)
  VALUES('${username}','${email}','${phoneNumber}','${companyName}','${location}','${0}','${0}','${0}');`;
  const profileDbResponse=await db.run(profileInsertQuery)
  response.send(JSON.stringify("Your Profile is Created Successfully"))
}
else{
 
  response.send(JSON.stringify("This user is already Registered..."))
  response.status(400)
}
})

//profile page
app.get("/profileData",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const selectUser=`SELECT * FROM interior_designer_details WHERE phone_number = '${userNumber}';`;
  const dbResponse=await db.get(selectUser);
  response.send(dbResponse)
  
})
//select spesific user for feed in create post 
app.get("/relatedUsers",jsonParser,async(request,response)=>{
  const gettingUsersQuery=`SELECT desigener_name,logo,designer_id FROM interior_designer_details ;`;
  const dbResponse=await db.all(gettingUsersQuery)
  response.send(dbResponse)
})


app.post("/selectedUsers",jsonParser,async(request,response)=>{
 const{searchResult}=request.body
  const searchQuery=`SELECT desigener_name,logo FROM interior_designer_details
  WHERE desigener_name LIKE '%${searchResult}%';`;
  const dbResponse=await db.all(searchQuery);
  response.send(dbResponse);
  console.log(dbResponse);


})
app.get("/feedData",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber};`;
  const deResponse=await db.get(getDesigner)
  const userId=deResponse.designer_id
  const feedQuery=`SELECT * , designerPost.postId AS postId ,designerPost.logo AS designerLogo FROM designerPost  LEFT  JOIN 
                  savedPosts ON  designerPost.postId = savedPosts.postId 
                  LEFT JOIN interior_designer_details ON savedPosts.userId = interior_designer_details.designer_id   ORDER BY postId DESC LIMIT 25;`
                  
  // const feedQuery=`SELECT * FROM designerPost  ORDER BY postId DESC LIMIT 25;`;
  const dbResponse=await db.all(feedQuery);
  response.send(dbResponse);
})
app.get("/logedInUser",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber} ;`;
  const deResponse1=await db.get(getDesigner)
  response.send(deResponse1);
})
let commentId=null
app.post("/comments",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const commentDetails=request.body
  const {userNumber}=request
  const {comment,postId}=commentDetails
  commentId=postId
  const commentTime = new Date().toISOString();
  const userNameQuery=`SELECT designer_id,logo,desigener_name FROM interior_designer_details WHERE phone_number=${userNumber};`;
  const userResponse=await db.get(userNameQuery);
  const designerId=userResponse.designer_id
  const commentsQuery=`INSERT INTO comments (designerId,postSId,comment,createdAt,updatedAt)
  VALUES('${designerId}','${postId}','${comment}','${Date.now()}','${null}');`;
  const dbResponse=await db.run(commentsQuery)
  const commentResponseQuery=`SELECT deignerName,desigener_name,interior_designer_details.logo AS image,comment,comments.createdAt AS commentsCreatedAt,thumbnail,postType
  FROM comments
  LEFT  JOIN designerPost
  ON designerPost.postId=comments.postSId LEFT JOIN interior_designer_details ON interior_designer_details.designer_id=comments.designerId WHERE postId=${postId}  ORDER BY commentId DESC;`;
  
  const commentResponse=await db.all(commentResponseQuery)
  console.log(commentResponse)
  response.send(commentResponse)

})
app.post("/viewComments",jsonParser,async(request,response)=>{
  const {postId}=request.body
  console.log(postId)
  const commentResponseQuery=`SELECT deignerName,desigener_name,interior_designer_details.logo AS image,comment,comments.createdAt AS commentsCreatedAt,thumbnail,postType
  FROM comments
  LEFT  JOIN designerPost
  ON designerPost.postId=comments.postSId LEFT JOIN interior_designer_details ON interior_designer_details.designer_id=comments.designerId WHERE postId=${postId}  ORDER BY commentId DESC;`;
  
  const commentResponse=await db.all(commentResponseQuery)
  console.log(commentResponse)
  response.send(commentResponse)
//   const viewCommentQuery=`SELECT * FROM comments WHERE feed_id='${feed_id}';`;
//  const comments= await db.all(viewCommentQuery);
//  console.log(comments);
//  response.status(200)
//  response.send(comments)

})
// app.post("/feeds",jsonParser,async(request,response)=>{
 
//   const feeds=`SELECT *
//   FROM comments
//   WHERE feed_id = '';`;
//   const dbResponse=await db.all(feeds);
//   console.log(dbResponse)
//   response.send(dbResponse)
// })
// creating virtualtours
app.post("/virtualtours",jwtAuthenticateToken,jsonParser,(request,response)=>{
  const {userNumber}=request
  console.log(userNumber)
  const  {tourTitle,description}=request.body
  const file=request.files.tourThumbnail
   const fileName=Date.now()+"_"+file.name
   filePath=__dirname+"/virtualThumbnails/"+fileName
   var path = "virtualThumbnails/"+fileName
   file.mv(filePath,async(error)=>{
    if(error){
      console.log(error)
      response.status(400)
    }
    else{
      const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber} ;`;
      const designerResponse=await db.get(getDesigner)
      const DesignerId1=designerResponse.designer_id
      const virtualTourQuery=`INSERT INTO virtual_tours(tour_name,tour_description,thumbnail_image,user_id,desigeners_id)
      VALUES('${tourTitle}','${description}','${path}','${userNumber}','${DesignerId1}');`;
      const dbResponse=await db.run(virtualTourQuery)
      const tourId=dbResponse.lastID
      response.send({tourId:tourId})
      // console.log(dbResponse.lastID)
    }
   })
})
//creating scenecs
app.post("/creteScene",jsonParser,async(request,response)=>{
  const sceneDetails=request.body
  const {scenename,sceneImage}=sceneDetails
  const insertQuery=`INSERT INTO temp_scenes (sceneName,sceneImage)
  VALUES('${scenename}','${sceneImage}');`;
  const dbResponse=await db.run(insertQuery);
 const dbGetMethod=`SELECT * FROM temp_scenes;`;
 const gettingMetos=await db.all(dbGetMethod)
 response.send(gettingMetos)
})
// app.get('/path',(request,response)=>{
//   const hotspots=request.body
//   const {sceneId,sceneName,hotspot}=hotspots
//   const hotspotQuery=`INSERT INTO hotspot(scene_id,hotspot_id,)`
// });

// const file=request.files.profileImages
//  const fileName=Date.now()+"_"+file.name
//  const filePath=__dirname+"/profileImages/"+fileName
//  file.mv(filePath,async(error)=>{
//   if(error){
//     console.log(error)
//   }
  
//  })
//
//inserting the hotspot positions into table 
app.post("/hotspots",jsonParser,async(request,response)=>{
  const sceneotspot=request.body
  const {sceneId,parsehotspots,hotspotName}=sceneotspot
  const hotspotQuery=`INSERT INTO hotspots(scene_id,x,y,z,hotspot_name)
  values('${sceneId}','${parsehotspots.x}','${parsehotspots.y}','${parsehotspots.z}','${hotspotName}');`;
  const dbResponse=await db.run(hotspotQuery);
  const selectHotsots=`SELECT x,y,z,hotspot_name,hotspot_id FROM hotspots WHERE scene_id='${sceneId}';`;
  const queryResult=await db.all(selectHotsots)
  console.log(queryResult)
  response.send(queryResult)
})
//deleteing hotspots
app.post("/deleteHotspot",jsonParser,async(request,response)=>{
  const {hotspotId,id}=request.body
 const deleteHotspot=`DELETE FROM hotspots WHERE  hotspot_id='${hotspotId}';`;
 const dbResponse=await db.run(deleteHotspot)
 const onDeleteHotspot=`SELECT x,y,z FROM hotspots WHERE scene_id='${id}';`;
 responseHotspots=await db.all(onDeleteHotspot)
 console.log(responseHotspots)
 response.send(responseHotspots)
})
//add (or) creating scenes
app.post("/scenes",jsonParser,(request,response)=>{
  console.log("scenes")
  const {sceneName,tourId}=request.body
  const file=request.files.sceneImage
  const fileName=Date.now()+"_"+file.name
  const filePath="sceneImages/"+fileName
  file.mv(filePath,async(error)=>{
    if(error){
      console.log(error)
    }
    else{
      const insertScene=`INSERT INTO scenes(scene_name,scene_image,tour_id)
      values('${sceneName}','http://13.233.231.34:9000/${filePath}','${tourId}');`;
      const dbResponse=await db.run(insertScene)
      console.log(dbResponse.lastID)
      const sceneQuery=`SELECT scene_id,scene_name,scene_image,tour_id FROM scenes WHERE scene_id='${dbResponse.lastID}';`;
      const latestScenes=await db.get(sceneQuery)
      const sceneImageUrl=`http://13.233.231.34:9000/${latestScenes.scene_images}`
      response.send(latestScenes)
    }
  })
})
// FILTERING THE HOTSPOTS FOR PERTICULAR SCENE....
app.post("/sceneHotspots",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const sceneHotspots=request.body
  const {id}=sceneHotspots
  const sceneGroupHotspots=`SELECT hotspot_id,x,y,z,scene_id  FROM hotspots WHERE scene_id='${id}';`;
 const dbResponse=await db.all(sceneGroupHotspots)
 response.send(dbResponse)
})
app.delete("/deleteScene",jsonParser,async(request,response)=>{
  const sceneDeleteInfo=request.body
  const {id,tourId}=sceneDeleteInfo
  const deleteScene=`DELETE FROM scenes WHERE scene_id='${id}';`;
  const dbResult=await db.run(deleteScene);
  // const deleteLinkScene=`DELETE  FROM single_hotspot WHERE orizinated_scene_id='${id}' ;`;
  // const deleteLinkingScenes=await db.run(deleteLinkScene)
  const deleteResponseQuery=`SELECT * FROM scenes WHERE tour_id='${tourId}';`;
  const selectResponseQuery=await db.all( deleteResponseQuery)
  console.log(selectResponseQuery)
  response.send(selectResponseQuery)
})
app.post("/linkedSpots",jsonParser,async(request,response)=>{
  console.log(request.body)
  const linkSpots=request.body
const{parseActiveSceneId,actionHotspot,parseActiveTourId,targetedSceneId}=linkSpots
const linkSpotInsertQuery=`INSERT INTO single_hotspot(hotspot_id,orizinated_scene_id,target_scene_id,active_tour_id)
VALUES('${actionHotspot}','${parseActiveSceneId}','${targetedSceneId}','${parseActiveTourId}');`;
const dbResponse=await db.run(linkSpotInsertQuery)
console.log(dbResponse)
response.send(dbResponse)
})
// viewer default scene
app.post("/viewer",jsonParser,async(request,response)=>{
  try{
  const tourIds=request.body
  const {parseTourId}=tourIds
  console.log(parseTourId)
  const tourId=`SELECT * FROM single_hotspot WHERE active_tour_id='${parseTourId}';`;
  const dbResponse=await db.all(tourId)
 
  const initialScene=dbResponse[0].orizinated_scene_id
  console.log(initialScene,"fg")
  const sceneGetQuery=`SELECT scene_id,scene_name,tour_id,scene_image,map_image FROM scenes WHERE scene_id='${initialScene}';`;
  const firstScene=await db.get(sceneGetQuery)
  console.log(firstScene,"first")
  const firstHotspots=firstScene.scene_id
  const gettingHotspots=`SELECT x,y,z,hotspot_id FROM hotspots WHERE scene_id='${firstHotspots}';`;
  const currentSceneHotspots=await db.all(gettingHotspots)
  console.log(firstScene,currentSceneHotspots)
  response.send([firstScene,currentSceneHotspots])
}
catch(error){
  console.log(error)
}
})
// linked scenes
app.post("/moveingScenes",jsonParser,async(request,response)=>{
  try{
 const hotspotDetails=request.body
 const {hotspotId}= hotspotDetails
 const linkSceneQuery=`SELECT * FROM single_hotspot WHERE hotspot_id='${hotspotId}';`;
 const selectedScene=await db.get(linkSceneQuery)
 const targetSceneElement= await selectedScene.target_scene_id
 const sceneGetQuery=`SELECT * FROM scenes WHERE scene_id='${targetSceneElement}';`;
 const dynamicScene=await db.get(sceneGetQuery)
 const movedSceneName=dynamicScene.scene_id
 const gettingHotspots=`SELECT x,y,z,hotspot_id FROM hotspots WHERE scene_id='${movedSceneName}';`;
  const currentSceneHotspots=await db.all(gettingHotspots)
 console.log(dynamicScene,currentSceneHotspots)
 response.send([dynamicScene,currentSceneHotspots])
 response.status(200)
  }
  catch(error){
    console.log(error)
  }
  
})

app.post("/mapImage",jsonParser,async(request,response)=>{
  const file=request.files.mapFile
  const activeSceneIds=request.body
  const {activeSceneId}=activeSceneIds
  const fileName=Date.now()+"_"+file.name
  const filePath="mapImages/"+fileName
  file.mv(filePath,async(error)=>{
    if(error){
      console.log(error)
    }
    else{
      const mapInsertQuery=  ` UPDATE scenes
      SET map_image = 'http://13.233.231.34:9000/${filePath}'
      WHERE scene_id = '${activeSceneId}';`;
      const dbResponse=await db.run(mapInsertQuery)
      const getMapImage=`SELECT map_image FROM scenes WHERE scene_id='${activeSceneId}';`;
      const mapImageget=await db.get(getMapImage)
      response.send(mapImageget)
      console.log(mapImageget)
    }
})
})

app.post("/getmapImage",jsonParser,async(request,response)=>{
  const sceneIdReques=request.body
  const {id}=sceneIdReques
  const mapImageQuery=`SELECT map_image FROM scenes WHERE scene_id='${id}';`;
  const mapImage=await db.get(mapImageQuery)
  response.send(mapImage)
  console.log(mapImage)
})
app.post("/tourData1",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const tourId=request.body
  const {userNumber}=request
  console.log(userNumber)
  const {parseTourId}=tourId
  const virtualTourQuery=`SELECT * FROM virtual_tours LEFT JOIN designerPost ON virtual_tours.tour_id=designerPost.tourId WHERE user_id='${userNumber}';`;
  const dbResponse=await db.all(virtualTourQuery);
  response.send(dbResponse)
  console.log(dbResponse,"poiukjhgfdcs")
  
  
 })
 app.post("/deleteTour",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const tourId=request.body
   const {tour_id}=tourId
   const {userNumber}=request
   console.log(tour_id)
  const virtualTourQuery=`DELETE FROM virtual_tours WHERE tour_id=${tour_id};`;
  const dbResponse=await db.run(virtualTourQuery);
  const deleteFeedData=`DELETE FROM designerPost WHERE tourId=${tour_id};`;
  await db.run(deleteFeedData)
  
  const selectVirtualTourQuery=`SELECT * FROM virtual_tours WHERE user_id=${userNumber};`;
  const dbResponseTour=await db.all(selectVirtualTourQuery);
  response.send(dbResponseTour)
  console.log(dbResponseTour)
 })
 app.post("/editScenes",jsonParser,async(request,response)=>{
  const selectedTour=request.body
  const {parseTourId}=selectedTour
  const editSceneQuery=`SELECT * FROM scenes WHERE tour_id=${parseTourId};`;
  const dbResonse=await db.all(editSceneQuery)
  console.log(dbResonse)
  response.send(dbResonse)
 })
 //upload images
 app.post("/postImage",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const subCategory=null;
  const likes=1;
  const {userNumber}=request
  const { feedImages } = request.files;
  const postDeatils=request.body
  const {caption,designStyle,propertyType,location,occupancy,propertySize,duration,tags,privacyState}=postDeatils
  const gettingDesignerID=`SELECT designer_id,desigener_name,logo FROM interior_designer_details WHERE phone_number='${userNumber}';`;
  const dbResonse=await db.get(gettingDesignerID);
  console.log(dbResonse.designer_id)
  const createdDesignerId=dbResonse.designer_id
  const createdDesignerName=dbResonse.desigener_name
  const designerLogo=dbResonse.logo
  if(dbResonse===null){
    response.send("UnAuthorized User")
    console.log("UnAuthorized User")
  }else{
    const fileImageLength=feedImages.length
    console.log(feedImages)
    let fileArray=[]
   if(fileImageLength>1){
    for (let i = 0; i < fileImageLength; i++) {
      const file=request.files.feedImages[i]
      const fileName=Date.now()+"_"+file.name
      const filePath="feedUploads/"+fileName
      file.mv(filePath)
      const filePathArray=fileArray.push(filePath)
      console.log(filePath ,"Filepath1112352435")
    }
   }
   else{
    const file=request.files.feedImages
    const fileName=Date.now()+"_"+file.name
    const filePath="feedUploads/"+fileName
    file.mv(filePath)
    const filePathArray=fileArray.push(filePath)
    // const splitFilePath=filePathArray.split(".")[1]
    //   console.log(splitFilePath)
  }



  const postInsertQuery=`INSERT INTO designerPost (designerId,postType,designStyle,category,subCategory,caption,privacy,likes,thumbnail,isActive,location,createdAt,updatedAt,occupancy,propertySize,duration,tags,deignerName,logo)
       VALUES('${createdDesignerId}','image','${designStyle}','${propertyType}','${subCategory}','${caption}','${privacyState}','${likes}','${fileArray} ','${false}','${location}','${Date.now()}','${null}','${occupancy}','${propertySize}','${duration}','${tags}','${createdDesignerName}','${designerLogo}');`;
      const insertingValuesintoDb=await db.run(postInsertQuery)
       response.send("Post is Uploaded Successfully")
      console.log(insertingValuesintoDb)




    }
} )  
//upload videos
app.post("/postVideo",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const subCategory=null;
  const likes=1;
  const {userNumber}=request
  const { feedImages,videoUpload } = request.files;
  const postDeatils=request.body
  const {caption,designStyle,propertyType,location,occupancy,propertySize,duration,tags,privacyState}=postDeatils
  const gettingDesignerID=`SELECT designer_id,desigener_name FROM interior_designer_details WHERE phone_number='${userNumber}';`;
  const dbResonse=await db.get(gettingDesignerID);


  console.log(dbResonse.designer_id)
  const createdDesignerId=dbResonse.designer_id
  const createdDesignerName=dbResonse.desigener_name 
  console.log(createdDesignerName,"asdfghj")
  if(dbResonse===null){
    response.send("UnAuthorized User")
    console.log("UnAuthorized User")
  }else{
    const fileImageLength=videoUpload.length
    console.log(videoUpload)
    let fileArray=[]
   if(fileImageLength>1){
    for (let i = 0; i < fileImageLength; i++) {
  const file=request.files.videoUpload[i]
  const fileName=Date.now()+"_"+file.name
  const filePath="feedUploads/"+fileName
  console.log(filePath)
  file.mv(filePath)
  const filePathArray=fileArray.push(filePath)
  console.log(filePath)
    }
  }
  else{
    const file=request.files.videoUpload
    const fileName=Date.now()+"_"+file.name
    const filePath="feedUploads/"+fileName
    file.mv(filePath)
    const filePathArray=fileArray.push(filePath)
      console.log(filePath)
  }



  console.log(fileArray)
      const postInsertQuery=`INSERT INTO designerPost (designerId,postType,designStyle,category,subCategory,caption,privacy,likes,thumbnail,isActive,location,createdAt,updatedAt,occupancy,propertySize,duration,tags,deignerName)
      VALUES('${createdDesignerId}','video','${designStyle}','${propertyType}','${subCategory}','${caption}','${privacyState}','${likes}','${fileArray}','${false}','${location}','${Date.now()}','${null}','${occupancy}','${propertySize}','${duration}','${tags}','${createdDesignerName}');`;
      const insertingValuesintoDb=await db.run(postInsertQuery)
 
 
     response.send("Post is Uploaded Successfully")
}
} )            
// post's Based on profiles
app.get("/profileAllposts",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber} ;`;
  const designerResponse=await db.get(getDesigner)
  const DesignerId1=designerResponse.designer_id
  const getAllPosts=`SELECT * FROM designerPost WHERE designerId=${DesignerId1} ORDER BY createdAt DESC;`;
  const postResponse=await db.all(getAllPosts)
  response.send(postResponse)
 
})
app.post("/designerPost",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {selectedPostId}=request.body
  const {userNumber}=request
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber} ;`;
  const designerResponse=await db.get(getDesigner)
  const DesignerId1=designerResponse.designer_id
  const getAllPosts=`SELECT * FROM designerPost WHERE designerId=${DesignerId1} ORDER BY CASE
  WHEN postId=${selectedPostId} THEN 0 ELSE 1 END,
  postId;`;
  // CASE
  // WHEN your_column_name = 124 THEN 0 -- Value from frontend, prioritize it first
  

  const postResponse=await db.all(getAllPosts)
  response.send(postResponse)
 
 
})
app.post("/designerSelectedPost",userJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {selectedPostId1}=request.body
  console.log(selectedPostId1)
  // const {userNumber}=request
  // console.log(userNumber,"poiuytref")
  // const getDesigner=`SELECT designer_id FROM usersDetails WHERE mobile=${userNumber} ;`;
  // const designerResponse=await db.get(getDesigner)
  // const DesignerId1=designerResponse.designer_id
  const getAllPosts=`SELECT * FROM designerPost WHERE postId=${selectedPostId1} ;`;
  const postResponse=await db.all(getAllPosts)
  response.send(postResponse)
  console.log(postResponse)
})
app.get("/360ImagesOnProfile",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const get360Posts=`SELECT * FROM virtual_tours WHERE user_id=${userNumber} ;`;
  const postResponse=await db.all(get360Posts)
  response.send(postResponse)
  console.log(postResponse)
})
app.post("/likesCount",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {postId}=request.body
  const {userNumber}=request
  const likedUserId=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber} ;`;
  const postResponse=await db.all(likedUserId)
  const designerId=postResponse[0].designer_id
  const insertLikes=`INSERT INTO likes(postId,userId,createdAt,updatedAt)
  VALUES('${postId}','${designerId}','${Date.now()}','null');`;
  const insertLikesResponse=await db.run(insertLikes)
  response.send(insertLikesResponse)
  console.log(insertLikesResponse)
})
app.post("/savedPost",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {postId}=request.body
  const {userNumber}=request
  const likedUserId=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber} ;`;
  const postResponse=await db.all(likedUserId)
  const designerId=postResponse[0].designer_id
  const insertSavedPosts=`INSERT INTO savedPosts(postId,userId)
  VALUES('${postId}','${designerId}');`;
  const savedPosts=await db.run(insertSavedPosts)
  response.send(savedPosts)
  
})
app.post("/deleteSavedPost",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {postId}=request.body
  const {userNumber}=request
  const likedUserId=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber} ;`;
  const postResponse=await db.all(likedUserId)
  const designerId=postResponse[0].designer_id
  const deleteSavedPost=`DELETE FROM savedPosts WHERE userId='${designerId}' AND postId='${postId}';`;
  const deleteResponse=await db.run(deleteSavedPost);
  console.log(deleteResponse)
  
})
//saved posts
app.get("/getSavedPost",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  let postArray=[]
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber} ;`;
  const designerResponse=await db.get(getDesigner)
  const DesignerId1=designerResponse.designer_id
  const getAllPosts=`SELECT postId FROM savedPosts WHERE userId=${DesignerId1} ORDER BY savedDesignId DESC; `;
  const postResponse=await db.all(getAllPosts)

  const postResponseLength=postResponse.length-1
  postResponse.forEach(element => {
    postArray.push(element.postId)
   
  });
  console.log(postArray)
  const savedPostData=`SELECT * FROM designerPost WHERE postId IN (${postArray});`;
  const dbResponse=await db.all(savedPostData)
  response.send(dbResponse)
  // console.log(postResponse)
 
})
//venor Signup

app.post("/venderSignup",jsonParser,async(request,response)=>{
  const{name,address,email,area,bankName,accountNumber,branch,ifscCode,PhoneNumber,teamSize,city ,gstNumber,selectedOptions,venderType}=request.body
  console.log(city,"city")
  const checkingVendor=`SELECT mobile FROM usersDetails WHERE mobile=${PhoneNumber};`;
  const vendorResult=await db.get(checkingVendor)
  if(vendorResult===undefined){
    const insertVenderDetails=`INSERT INTO usersDetails (name,emailId,mobile,otp,slug,role,address,isActive,createdAt,updatedAt)
    VALUES('${name}','${email}','${PhoneNumber}','NULL','${Date.now()}',${1},'${address}','${true}','${Date.now()}',${null});`;
    const dbResonse=await db.run(insertVenderDetails);
    const signUpUser=`SELECT userId FROM usersDetails WHERE mobile='${PhoneNumber}';`;
    const currentUser=await db.get(signUpUser)
    const signUpUserId=currentUser.userId
    const insertBankDetails=`INSERT INTO bankdetails(userId,bankName,AccountNumber,branch,IFSCCODE,GST,createdAt,updatedAt)
    VALUES('${signUpUserId}','${bankName}','${accountNumber}','${branch}','${ifscCode}','${gstNumber}','${Date.now()}','${null}');`;
    const bankDetailsResponse=await db.run(insertBankDetails)
    console.log(bankDetailsResponse)
    const insertCities=`INSERT INTO cities (cityName,area,createdAt,updatedAt,createdBy,updatedBy)
    VALUES('${city}','${area}','${Date.now()}','${null}','${null}','${null}');`;
    const cityResponse=await db.run(insertCities);
    const insertVendorType=`INSERT INTO vendortype (vendorId,vendorType,createdAt,updatedAt)
    VALUES('${signUpUserId}',"${venderType}",'${Date.now()}','${null}');`;
    const vendorTypeResponse=await db.run(insertVendorType);
    const insertTeamSize=`INSERT INTO vendorteam(vendorId,teamSize,createdAt,updatedAt)
    VALUES('${signUpUserId}','${teamSize}','${Date.now()}','${null}');`;
    const teamSizeResponse=await db.run(insertTeamSize)
    response.send(JSON.stringify("Your Profile is Created Successfull"))
  }
  else{
    response.send(JSON.stringify("This user is already Registered..."))
    console.log("User is Exist")
  }
 
})
//vendor login
app.post("/vendorLogin/",jsonParser,async(request,response)=>{
  const {phoneNumber}=request.body
  const loginSearch=`SELECT userId FROM usersDetails WHERE mobile='${phoneNumber}';`;
  const searchedUser=await db.get(loginSearch)
  if(searchedUser===undefined){
    response.status(404)
    response.send({"error_msg":"Mobile number is not Registered"})
    
  }
  else{
    const payload={phoneNumber:phoneNumber,}
    const jwtToken=jwt.sign(payload,"vendorLoginToken")
    response.send({jwtToken})
    console.log({jwtToken},phoneNumber)
    
  }

})
app.post("/vendorProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
 const {title,description,descriptionStatus,titleStatus,thickness,length,width,productType,brand,sqFeets,fettInput,productColor,material,selectType,spaceType,usage,qty,price,tax,noOfDays,shippingCharges}=request.body
 const { productImages } = request.files;
 const {userNumber}=request
 console.log(productImages,"plkjhgfd")
 const productImageLength=productImages.length
 let productArray=[]
if(productImageLength>1){
 for (let i = 0; i < productImageLength; i++) {
const file=request.files.productImages[i]
const fileName=Date.now()+"_"+file.name
const filePath="vendorProducts/"+fileName
file.mv(filePath)
const filePathArray=productArray.push(filePath)
 }

}
else{
  const file=request.files.productImages
const fileName=Date.now()+"_"+file.name
const filePath="vendorProducts/"+fileName
file.mv(filePath)
const filePathArray=productArray.push(filePath)
 }

 const getDesigner=`SELECT userId FROM usersDetails WHERE mobile='${userNumber}' ;`;
 const designerResponse=await db.get(getDesigner)
 const vendorId=designerResponse.userId
 console.log(vendorId,designerResponse)
// const vendorId=`SELECT `
 const selectBrandId=`SELECT productBrandId FROM prouctBrand WHERE brandName='${brand}';`;
 const getBrandId=await db.get(selectBrandId);
 const brandId=getBrandId.productBrandId
 const selectColorId=`SELECT productColorId FROM productcolor WHERE color='${productColor}';`;
 const getColorId=await db.get(selectColorId);
 const colorId=getColorId.productColorId
 const selectProductTypeId=`SELECT productTypeId FROM productType WHERE name='${productType}';`;
 const getProductTypeId=await db.get(selectProductTypeId);
 const productTypeId=getProductTypeId.productTypeId
 const selectMaterialId=`SELECT productMaterialId FROM productmaterial WHERE material='${material}';`;
 const getMaterialId=await db.get(selectMaterialId);
 const productMaterialId=getMaterialId.productMaterialId
 const insertProductData=`INSERT INTO products(title,description,productBrandId,productColorId,productTypeId,productMaterialId,productSize,productType,usages,quantity,price,tax,shippingCharges,estimateDeliviry,thumbnail,createdAt,updatedAt,thickness,length,width,status,createdBy)
 VALUES('${title}','${description}','${brandId}','${colorId}','${productTypeId}','${productMaterialId}','${fettInput} ${sqFeets}','${selectType}','${usage}','${qty}','${price}','${tax}','${shippingCharges}','${noOfDays}','${productArray}','${Date.now()}',${null},'${thickness}','${length}','${width}','active','${vendorId}');`;
 const productDbResponse=await db.run(insertProductData);
 response.send("Product is Add Successfully")

})

app.post("/storeProducts",jsonParser,async(request,response)=>{
  const {materialName}=request.body
  const getProducts=`SELECT productId,title,description,name,thumbnail
  FROM products
  LEFT JOIN productType
  ON products.productTypeId= productType.productTypeId WHERE name='${materialName}';`;
  products=await db.all(getProducts);
  response.send(products)
  console.log(products)
  // const getProducts =`SELECT title,description,thumbnail FROM products WHERE `
  console.log(request.body)
})
app.get("/material",jsonParser,async(request,response)=>{
  const getMaterial=`SELECT productTypeId,name FROM productType;`;
  const material=await db.all(getMaterial)
  response.send(material)
  console.log(material)
})

app.post("/productDetailview",jsonParser,async(request,response)=>{
  const {productId}=request.body
  const getProductDetails=`SELECT productId,title,description,productType,name,productSize,usages,quantity,price,tax,shippingCharges,estimateDeliviry,thumbnail,brandName,color,material FROM products LEFT JOIN productType ON products.productTypeId=productType.productTypeId LEFT JOIN prouctBrand ON products.productBrandId=prouctBrand.productBrandId LEFT JOIN productcolor ON products.productColorId=productcolor.productColorId LEFT JOIN productmaterial ON products.productMaterialId=productmaterial.productMaterialId WHERE productId='${productId}';`;
  const productDetails=await db.get(getProductDetails);
  response.send(productDetails)
  console.log(productDetails)
})
app.post("/virtualTourCreater",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const subCategory=null;
  const likes=1;
  const {userNumber}=request
  const { feedImages } = request.files;
  const postDeatils=request.body
  const {presentTourd,tourTitle,designStyle,propertyType,location,occupancy,propertySize,timeDuration,tags,privacy}=postDeatils
  const gettingDesignerID=`SELECT designer_id,desigener_name,logo FROM interior_designer_details WHERE phone_number='${userNumber}';`;
  const dbResonse=await db.get(gettingDesignerID);
  const createdDesignerId=dbResonse.designer_id
  const createdDesignerName=dbResonse.desigener_name
  const designerLogo=dbResonse.logo
  if(dbResonse===null){
    response.send("UnAuthorized User")
  
  }else{
    const fileImageLength=feedImages.length
    let fileArray=[]
   if(fileImageLength>1){
    for (let i = 0; i < fileImageLength; i++) {
      const file=request.files.feedImages[i]
      const fileName=Date.now()+"_"+file.name
      const filePath="feedUploads/"+fileName
      file.mv(filePath)
      const filePathArray=fileArray.push(filePath) 
    }
   }
   else{
    const file=request.files.feedImages
    const fileName=Date.now()+"_"+file.name
    const filePath="feedUploads/"+fileName
    file.mv(filePath)
    const filePathArray=fileArray.push(filePath)
    // const splitFilePath=filePathArray.split(".")[1]
    //   console.log(splitFilePath)
   }
  const postInsertQuery=`INSERT INTO designerPost (designerId,postType,designStyle,category,subCategory,caption,privacy,likes,thumbnail,isActive,location,createdAt,updatedAt,occupancy,propertySize,duration,tags,deignerName,logo,tourId)
       VALUES('${createdDesignerId}','virtualTourImage','${designStyle}','${propertyType}','${subCategory}','${tourTitle}','${privacy}','${likes}','${fileArray} ','${false}','${location}','${Date.now()}','${null}','${occupancy}','${propertySize}','${timeDuration}','${tags}','${createdDesignerName}','${designerLogo}','${presentTourd}');`;
      const insertingValuesintoDb=await db.run(postInsertQuery)
       response.send("Post is Uploaded Successfully")
      console.log(insertingValuesintoDb)
}
} )  


app.post("/virtualTourDetailview",jsonParser,async(request,response)=>{
  const {currentTourId}=request.body
  const joinQuery=`SELECT * FROM designerPost LEFT JOIN virtual_tours ON designerPost.tourId=virtual_tours.tour_id WHERE tour_id='${currentTourId}';`;
  const dbResponse=await db.get(joinQuery);
  response.send(dbResponse)
  console.log(dbResponse)
})

app.post("/userRegister",jsonParser,async(request,response)=>{
  const {name,phoneNumber}=request.body
  const checkingVendor=`SELECT mobile FROM usersDetails WHERE mobile=${phoneNumber};`;
  const vendorResult=await db.get(checkingVendor)
  if(vendorResult===undefined){
    const insertVenderDetails=`INSERT INTO usersDetails (name,emailId,mobile,otp,slug,role,address,isActive,createdAt,updatedAt)
    VALUES('${name}','','${phoneNumber}','NULL','${Date.now()}',${2},'${null}','${true}','${Date.now()}',${null});`;
    const dbResonse=await db.run(insertVenderDetails);
    // response.send(JSON.stringify("Your Profile is Created Successfully"))
    const payload={phoneNumber:phoneNumber,}
    const jwtToken=jwt.sign(payload,"user_login_token")
    response.send({jwtToken})
  }
  else{
    const payload={phoneNumber:phoneNumber,}
    const jwtToken=jwt.sign(payload,"user_login_token")
    response.send({jwtToken})
  }
})
app.post("/userLoginCheck/",jsonParser,async(request,response)=>{
  const phone=request.body
  const {phoneNumber}=phone
  console.log(phoneNumber)
  dbQuery=`SELECT * FROM usersDetails WHERE mobile='${phoneNumber}' AND role='${2}';`;
  const dbResponse=await db.get(dbQuery)
  console.log(dbResponse)
  if(dbResponse===undefined){
    console.log(dbResponse ,"iffff")
    response.status(404)
    response.send({"error_msg":"Mobile number is not Registered"})  
  }
  else{
    console.log(dbResponse,"elseee")
    //creating jsonweb token
    const payload={phoneNumber:phoneNumber,}
    const jwtToken=jwt.sign(payload,"user_login_token")
    response.send({jwtToken})
    console.log({jwtToken},phoneNumber)
    
  }
  // const response1=`SELECT * FROM interior_designer_details WHERE phone_number='${phone}';`;
  // const dbResponse=await db.get(response1)
  // console.log(dbResponse)

})

app.post("/createProject",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {projectName}=request.body
  const {userNumber}=request
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber};`;
  const deResponse=await db.get(getDesigner)
  const designerId=deResponse.designer_id
  const projectDataQuery=`INSERT INTO projects (title,designerId,userId,status,createdAt)
  VALUES('${projectName}','${designerId}','${1}','ongoing','${Date.now()}');`;
  const responeProject=await db.run(projectDataQuery);
  response.send(responeProject)
  console.log(responeProject)
})
app.get("/ongoingProjects",jwtAuthenticateToken,async(request,response)=>{
  const {userNumber}=request
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number='${userNumber}';`;
  const deResponse=await db.get(getDesigner)
  const designerId=deResponse.designer_id
  const ongoingProjectsData=`SELECT projectId,title,designerId,userId,status,createdAt,updatedAt FROM projects WHERE designerId=${designerId} AND status='ongoing';`;
  const responseProjects=await db.all(ongoingProjectsData);
  response.send(responseProjects)
  console.log(responseProjects)
})
//create spacess
app.post("/createSpaces",jsonParser,async(request,response)=>{
  const {spacename,projectId}=request.body
  const {spaceImage}=request.files
  const file=request.files.spaceImage
  const fileName=Date.now()+"_"+file.name
  const filePath="spaces/"+fileName
  file.mv(filePath,async(error)=>{
    if(error){
      console.log(error)
    }
    else{
      const insertSpaceDetails=`INSERT INTO projectSpace (projectId,spaceName,createdAt,spaceImage)
      VALUES('${projectId}','${spacename}','${Date.now()}','http://13.233.231.34:9000/${filePath}');`;
      const dbResponse=await db.run(insertSpaceDetails);
      const selectSpaces=`SELECT * FROM projectSpace WHERE projectId='${projectId}';`;
  const spaceResponse=await db.all(selectSpaces)
  response.send(spaceResponse)
  console.log(spaceResponse)
    }
})
})
app.post("/spaceCards",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {projectId}=request.body
  const selectSpaces=`SELECT * FROM projectSpace WHERE projectId='${projectId}';`;
  const dbResponse=await db.all(selectSpaces)
  console.log(dbResponse)
  response.send(dbResponse)
})
app.get("/projectsInStore",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number='${userNumber}';`;
  const deResponse=await db.get(getDesigner)
  const designerId=deResponse.designer_id
  const getAllProjects=`SELECT * FROM projects WHERE designerId='${designerId}' AND status='ongoing';`;
  const projectResponse=await db.all(getAllProjects);
  response.send(projectResponse)
  console.log(projectResponse)
})
app.post("/projectSpaceProducts",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  let dbResponse=""
  const spaceProducts=request.body
  const {productId,productType,productSize,spacesId,quentity,availableQty}=spaceProducts
  const splitSpaceId=spacesId.split(",")
  const spaceArrayLength=splitSpaceId.length-1
  for(let i=0; i<=spaceArrayLength;i++){
    const spaceId=splitSpaceId[i]
    const productInsertQuery=`INSERT INTO projectSpaceProducts (spaceId,productId,quentity,productType,squareFeet,createdAt)
    VALUES ('${spaceId}','${productId}','${quentity}','${productType}','${productSize}','${Date.now()}');`;
     dbResponse=await db.run(productInsertQuery);
  }
  const updateQuentity=`UPDATE products
  SET quantity ='${availableQty}'
  WHERE productId='${productId}';
  `
  const updateQueryResult=await db.run(updateQuentity);
  console.log(updateQueryResult)
  response.status(200)
  response.send(dbResponse)
 
}) 
app.post("/spaceProducts",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {spaceId}=request.body
  const joinQuery=`SELECT *, projectSpace.spaceId AS projectSpaceId,projectSpaceProducts.spaceId AS spacesId FROM products LEFT JOIN   projectSpaceProducts ON products.productId=projectSpaceProducts.productId LEFT JOIN projectSpace ON projectSpaceProducts.spaceId=projectSpace.spaceId WHERE spacesId='${spaceId}';`;
  const dbResponse=await db.all(joinQuery)
  console.log(dbResponse)
  response.send(dbResponse)
}) 
app.get("/estimateProjectList",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number='${userNumber}';`;
  const deResponse=await db.get(getDesigner)
  const designerId=deResponse.designer_id
  const projectListQuery=`SELECT * FROM projects WHERE designerId=${designerId};`;
  const projectList=await db.all(projectListQuery);
  response.send(projectList)
  console.log(projectList)
})
app.post("/estimateProducts",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  let spaceIdArray=[]
  console.log(request.body)
  const {projectId}=request.body
  // const getProductQuery=`SELECT spaceId FROM projectSpace WHERE projectId='${projectId}';`;
  // const project =await db.all(getProductQuery)
  // const spaceArrayLength=project.length-1
  // for(let i=0;i<=spaceArrayLength;i++){
  //   const spaceIds=project[i].spaceId
  //   console.log(spaceIds)
  //   spaceIdArray.push(spaceIds)
  //   console.log(spaceIdArray)
  // }
  const joinQuery=`SELECT *, projectSpace.spaceId AS projectSpaceId,projectSpaceProducts.spaceId AS spacesId FROM products LEFT JOIN   projectSpaceProducts ON products.productId=projectSpaceProducts.productId LEFT JOIN projectSpace ON projectSpaceProducts.spaceId=projectSpace.spaceId WHERE spacesId IN (SELECT spaceId FROM projectSpace WHERE projectId='${projectId}' GROUP BY spaceName);`;
  const dbResponse=await db.all(joinQuery)
  console.log(dbResponse)
  response.send(dbResponse)
 
})

app.get("/estimateDesignerDetails",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const getDesigner=`SELECT * FROM interior_designer_details WHERE phone_number='${userNumber}';`;
  const dbResponse=await db.get(getDesigner)
  response.send(dbResponse)
  console.log(dbResponse)
})
app.post("/editDesignerProfile",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {username,email,phoneNumber,address,location}=request.body
  const {profileImages}=request.files
  const {userNumber}=request
  
  const fileName=Date.now()+"_"+request.files.profileImages.name
  const file=request.files.profileImages
  const filePath="uploads/"+fileName
  
  file.mv(filePath,async(error)=>{
    if(error){
      return(response.send(error))
    }
   const updateProfile=`UPDATE interior_designer_details
   SET desigener_name = '${username}',email_id = '${email}',phone_number='${phoneNumber}',address='${address}',area='${location}',logo='${filePath}'
   WHERE phone_number=${userNumber}; `
   const dbResponse=await db.run(updateProfile);
   response.send("Profile Updated successfully")
  
  
  })
})
// vendor services
app.get("/vendorServices",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const vendorServices=`SELECT serviceName,serviceId FROM vendorServices `
  const dbResponse=await db.all(vendorServices)
  response.send(dbResponse)
  console.log(dbResponse)
})
app.post("/vendorService",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {serviceDetails}=request.body
  const {userNumber}=request
  const{price,laborCharge,service,perArea}=request.body
  
  const vendorIdQuery=`SELECT userId FROM usersDetails WHERE mobile=${userNumber} AND role=${1};`;
  const responseVendorId=await db.get(vendorIdQuery);
  const vendorId=responseVendorId.userId
  const serviceQuery=`SELECT serviceId from vendorServices WHERE serviceName='${service}';`;
  const serviceResponse=await db.get(serviceQuery)
  const serviceId=serviceResponse.serviceId
  console.log(serviceResponse)
  
  console.log(vendorId)
  const insertServiceDetails=`INSERT INTO vendorService (vendorId,serviceId,laborCost,servicePrice,perArea,createdAt)
  VALUES('${vendorId}','${serviceId}','${laborCharge}','${price}','${perArea}',${Date.now()});`;
  const serviceDetailsResponse=await db.run(insertServiceDetails)
})
app.get("/vendorAllProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
 const vendorIdQuery=`SELECT userId FROM usersDetails WHERE mobile=${userNumber} AND role=${1};`;
  const responseVendorId=await db.get(vendorIdQuery);
  const vendorId=responseVendorId.userId
  const allProducts=`SELECT * FROM products WHERE createdBy='${vendorId}';`;
  const productsResponse=await db.all(allProducts);
  response.send(productsResponse)
  console.log(productsResponse)
})
app.get("/vendoractiveProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
 const vendorIdQuery=`SELECT userId FROM usersDetails WHERE mobile=${userNumber} AND role=${1};`;
  const responseVendorId=await db.get(vendorIdQuery);
  const vendorId=responseVendorId.userId
  const allProducts=`SELECT * FROM products WHERE createdBy='${vendorId}' AND status='active';`;
  const productsResponse=await db.all(allProducts);
  response.send(productsResponse)
  console.log(productsResponse)
})
app.get("/vendorpausedProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const vendorIdQuery=`SELECT userId FROM usersDetails WHERE mobile=${userNumber} AND role=${1};`;
   const responseVendorId=await db.get(vendorIdQuery);
   const vendorId=responseVendorId.userId
   const allProducts=`SELECT * FROM products WHERE createdBy='${vendorId}' AND status='paused';`;
   const productsResponse=await db.all(allProducts);
   response.send(productsResponse)
   console.log(productsResponse)
})
app.get("/vendorDeletedProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const vendorIdQuery=`SELECT userId FROM usersDetails WHERE mobile=${userNumber} AND role=${1};`;
   const responseVendorId=await db.get(vendorIdQuery);
   const vendorId=responseVendorId.userId
   const allProducts=`SELECT * FROM products WHERE createdBy='${vendorId}' AND status='delete';`;
   const productsResponse=await db.all(allProducts);
   response.send(productsResponse)
   console.log(productsResponse)
})
app.put("/pausedProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {productid}=request.body
  console.log(productid)
  const updateStatus=`UPDATE products
  SET status = 'paused'
  WHERE productId = '${productid}';`;
  const dbResonse=await db.run(updateStatus)
  console.log(dbResonse)

})           
app.put("/deleteProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {productid}=request.body
  console.log(productid)
  const updateStatus=`UPDATE products
  SET status = 'delete'
  WHERE productId = '${productid}';`;
  const dbResonse=await db.run(updateStatus)
  console.log(dbResonse)

})  
app.put("/restoreProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const { productId}=request.body
  console.log( productId)
  const updateStatus=`UPDATE products
  SET status = 'active'
  WHERE productId = '${productId}';`;
  const dbResonse=await db.run(updateStatus)
  console.log(dbResonse)
  response.send(JSON.stringify("Restored successfully"))
  

}) 