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
const sizeOf = require('image-size');
const fs = require('fs/promises'); // Add this line
const url = require("url");
const bcrypt=require("bcrypt");
const multer = require('multer');
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
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });
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
    console.log(`server is running at ${PORT} PORT`);
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
      const selectUsername=`SELECT * FROM users WHERE user_name = '${userName}';`;
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
        console.log('User already exist response . status')
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
      console.log("Invalid Password")

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
  const {propertyType,residentialType,service,occupancy,status,category,area1,measurement,locality,city,timeDuration,budget}=propertyDetails
  const insertingPropertyDetails=`INSERT INTO property_details(property_type,residential_type,service,occupancy,status,category,project_area,measurement,locality,city,time_duration,user_id,budget)
  VALUES('${propertyType}','${residentialType}','${service}','${occupancy}','${status}','${category}','${area1}','${measurement}','${locality}','${city}','${timeDuration}','${globalHouseOwnerId}','${budget}');`;
  const dbResponse=await db.run(insertingPropertyDetails)
  response.send(JSON.stringify("submitted Successfully"))
})
//individual designer registration(signup)
app.post("/designer/signup/",jsonParser,async(request,response)=>{
  const desigenerLogo=request.files
  console.log(request.files)
  const desigenerDetails= request.body
  const {name,address,email,area,budget,bankName,accountNumber,branch,ifscCode,PhoneNumber,logoFile}=desigenerDetails

  if (desigenerLogo===null){
  let filePath=""
  const selectUser=`SELECT * FROM interior_designer_details WHERE phone_number = '${PhoneNumber}';`;
  const dbResponse=await db.get(selectUser);
 if(dbResponse===undefined){
  const designerSignupQuery=`INSERT INTO interior_designer_details (desigener_name,email_id,phone_number,area,logo,budget,bank_name,account_number,branch,ifsc_code,address,number_of_posts,number_of_followers,number_of_following)
  VALUES('${name}','${email}','${PhoneNumber}','${area}','${filePath}','${budget}','${bankName}','${accountNumber}','${branch}','${ifscCode}','${address}',0,0,0);`;
  const dbResponse=await db.run(designerSignupQuery)
  response.send("User is created Successfully")
 }
 else{
  response.send("user is already existed with this Mobile number")
  response.status(400)
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
 if(dbResponse===undefined){
  const designerSignupQuery=`INSERT INTO interior_designer_details (desigener_name,email_id,phone_number,area,logo,budget,bank_name,account_number,branch,ifsc_code,address,number_of_posts,number_of_followers,number_of_following)
  VALUES('${name}','${email}','${PhoneNumber}','${area}','${filePath}','${budget}','${bankName}','${accountNumber}','${branch}','${ifscCode}','${address}',0,0,0);`;
  const dbResponse=await db.run(designerSignupQuery)
  response.send("User is created Successfully")
 }
 else{
  response.send("user is already existed with this Mobile number")
  response.status(400)
 }
}
})
//file upload
//login with otp
app.post("/checkingPhonenumbers/",jsonParser,async(request,response)=>{
console.log('checkingPhonenumbers')
  const phone=request.body
  const {phoneNumber}=phone
  dbQuery=`SELECT * FROM interior_designer_details WHERE phone_number='${phoneNumber}';`;
  const dbResponse=await db.get(dbQuery)
  if(dbResponse===undefined){
    response.status(404)
    response.send({"error_msg":"Mobile number is not Registered"})
  }
  else{
    //creating jsonweb token
    const payload={phoneNumber:phoneNumber,}
    const jwtToken=jwt.sign(payload,"designer_login_token")
    response.send({jwtToken})
  }
})
//middleware function 
const jwtAuthenticateToken=(request,response,next)=>{
  let jwtToken;
  const role=request.headers["role"]
  const authHead=request.headers["authorization"]
  console.log("hellooo")

  if(authHead!== undefined){
  jwtToken=authHead.split(" ") [1];
  }
  if(jwtToken===undefined){
    response.status(401)
    response.send(JSON.stringify("Unauthorized User"))
    console.log("Unauthorized User")

  }
  else{
    if(role==3){
      jwt.verify(jwtToken,"houseOwnerLogin",(error,payload)=>{
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
  const checkWithDesignerTable=`SELECT phone_number FROM interior_designer_details WHERE phone_number='${mobileNumber}';`;
  const responseDesignerTable=await db.get(checkWithDesignerTable);
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
})
app.post("/post/",jsonParser,jwtAuthenticateToken,async(request,response)=>{
  const file=request.files.multipleUploadImage
  const fileName=Date.now()+"_"+request.files.multipleUploadImage.name
  const filePath=`feedUploads/${fileName}`;
  file.mv(filePath,async(error)=>{
   if(error){
      return(response.send(error))
   }
   else{
  const {userNumber}=request
  const selectUserId=`SELECT desigener_name from interior_designer_details WHERE phone_number='${userNumber}';`;
  const dbResponse=await db.get(selectUserId);
  const feedDetails=request.body;
  // const fileUrl = `https://venkatsai.onrender.com/${filePath}`;
  const {description,property,subType,Occupancy,Category,DesignStyle,Locality,city,privacy}=feedDetails;
  const feedInsertQuery=`INSERT INTO feed_details(feed_images,description,property_type,property,occupancy,category,design_style,locality,city,user_id,privacy)
  VALUES('${filePath}','${description}','${property}','${subType}','${Occupancy}','${Category}','${DesignStyle}','${Locality}','${city}','${dbResponse.desigener_name}','${privacy}');`;
  const dbResonse=await db.run(feedInsertQuery)
  // res.json({ message: 'Feed is uploaded successfully', fileUrl });
  response.send(JSON.stringify("Feed is uploaded successfully"));   
    }
   })
})
//edit profile/ create profile
app.post("/editProfile",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const profileDetails=request.body
  const {username,email,phoneNumber,companyName,location}=profileDetails
  const checkingProfile=`SELECT phone_number FROM designer_profile_details where phone_number='${phoneNumber}';`;
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
  console.log('Helloooo')
  const {userNumber}=request
  const selectUser=`SELECT * FROM interior_designer_details WHERE phone_number = '${userNumber}';`;
  const dbResponse=await db.get(selectUser);
  response.send(dbResponse)
  
})
app.get("/houseOwnerProfileData",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  
  const selectUser=`SELECT * FROM usersDetails WHERE mobile = '${userNumber}' AND role='${3}';`;
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
})
app.get('/feedDataResidentialFilter',jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const { page, pageSize ,category } = request.query;
  const offset = (page - 1) * pageSize;
  const {userNumber}=request
  console.log(page, pageSize ,"page, pageSize ")
  
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber};`;
  const deResponse=await db.get(getDesigner)
  const userId=deResponse.designer_id
  const feedQuery=`SELECT * , designerPost.postId AS postId ,designerPost.logo AS designerLogo FROM designerPost  LEFT  JOIN 
                  savedPosts ON  designerPost.postId = savedPosts.postId 
                  LEFT JOIN interior_designer_details ON savedPosts.userId = interior_designer_details.designer_id WHERE privacy ='Public' AND category LIKE ${category} ORDER BY postId DESC LIMIT ${pageSize} OFFSET ${offset};`
                  
  // const feedQuery=`SELECT * FROM designerPost  ORDER BY postId DESC LIMIT 25;`;
  const dbResponse=await db.all(feedQuery);
  response.send(dbResponse);

})
app.get("/feedData",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  console.log("feedDataa")
  // const { page, pageSize  } = request.query;
  // const offset = (page - 1) * pageSize;
  // const {userNumber}=request
  // console.log(page, pageSize ,"page, pageSize ")
  
  // const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber};`;
  // const deResponse=await db.get(getDesigner)
  // const userId=deResponse.designer_id
  const feedQuery=`SELECT * , designerPost.postId AS postId ,designerPost.logo AS designerLogo FROM designerPost  LEFT  JOIN 
                  savedPosts ON  designerPost.postId = savedPosts.postId 
                  LEFT JOIN interior_designer_details ON savedPosts.userId = interior_designer_details.designer_id WHERE privacy ='Public'  ORDER BY postId DESC ;`;
                  
  // const feedQuery=`SELECT * FROM designerPost  ORDER BY postId DESC LIMIT 25;`;
  const dbResponse=await db.all(feedQuery);
  response.send(dbResponse);
})
app.get("/exploreFeedData",jsonParser,async(request,response)=>{
  console.log("feedDataa")
  // const { page, pageSize  } = request.query;
  // const offset = (page - 1) * pageSize;
  // const {userNumber}=request
  // console.log(page, pageSize ,"page, pageSize ")
  
  // const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber};`;
  // const deResponse=await db.get(getDesigner)
  // const userId=deResponse.designer_id
  const feedQuery=`SELECT * , designerPost.postId AS postId ,designerPost.logo AS designerLogo FROM designerPost  LEFT  JOIN 
                  savedPosts ON  designerPost.postId = savedPosts.postId 
                  LEFT JOIN interior_designer_details ON savedPosts.userId = interior_designer_details.designer_id WHERE privacy ='Public'  ORDER BY postId DESC;`
                  
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
  response.send(commentResponse)

})
app.post("/viewComments",jsonParser,async(request,response)=>{
  const {postId}=request.body
  console.log(postId,"PostIddddd")
  const commentResponseQuery=`SELECT deignerName,desigener_name,interior_designer_details.logo AS image,comment,comments.createdAt AS commentsCreatedAt,thumbnail,postType
  FROM comments
  LEFT  JOIN designerPost
  ON designerPost.postId=comments.postSId LEFT JOIN interior_designer_details ON interior_designer_details.designer_id=comments.designerId WHERE postId=${postId}  ORDER BY commentId DESC;`;
  const commentResponse=await db.all(commentResponseQuery)
  response.send(commentResponse)

})
// creating virtualtours
app.post("/virtualtours",jwtAuthenticateToken,jsonParser,(request,response)=>{
  const {userNumber}=request
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
      const designerResponse=await db.get(getDesigner);
      const DesignerId1=designerResponse.designer_id;
      const virtualTourQuery=`INSERT INTO virtual_tours(tour_name,tour_description,thumbnail_image,user_id,desigeners_id)
      VALUES('${tourTitle}','${description}','${path}','${userNumber}','${DesignerId1}');`;
      const dbResponse=await db.run(virtualTourQuery);
      const tourId=dbResponse.lastID;
      response.send({tourId:tourId});
    }
   })
})
//creating scenecs
app.post("/creteScene",jsonParser,async(request,response)=>{
  const sceneDetails=request.body;
  const {scenename,sceneImage}=sceneDetails;
  const insertQuery=`INSERT INTO temp_scenes (sceneName,sceneImage)
  VALUES('${scenename}','${sceneImage}');`;
  const dbResponse=await db.run(insertQuery);
 const dbGetMethod=`SELECT * FROM temp_scenes;`;
 const gettingMetos=await db.all(dbGetMethod);
 response.send(gettingMetos);
})
//inserting the hotspot positions into table 
app.post("/hotspots",jsonParser,async(request,response)=>{
  const sceneotspot=request.body;
  const {sceneId,parsehotspots,hotspotName}=sceneotspot;
  const hotspotQuery=`INSERT INTO hotspots(scene_id,x,y,z,hotspot_name)
  values('${sceneId}','${parsehotspots.x}','${parsehotspots.y}','${parsehotspots.z}','${hotspotName}');`;
  const dbResponse=await db.run(hotspotQuery);
  const selectHotsots=`SELECT x,y,z,hotspot_name,hotspot_id FROM hotspots WHERE scene_id='${sceneId}';`;
  const queryResult=await db.all(selectHotsots);
  response.send(queryResult);
})
//deleteing hotspots
app.post("/deleteHotspot",jsonParser,async(request,response)=>{
  const {hotspotId,id}=request.body;
 const deleteHotspot=`DELETE FROM hotspots WHERE  hotspot_id='${hotspotId}';`;
 const dbResponse=await db.run(deleteHotspot);
 const onDeleteHotspot=`SELECT x,y,z FROM hotspots WHERE scene_id='${id}';`;
 responseHotspots=await db.all(onDeleteHotspot);
 response.send(responseHotspots);
})
//add (or) creating scenes
app.post("/scenes",jsonParser,(request,response)=>{
  const {sceneName,tourId}=request.body;
  const file=request.files.sceneImage;
  const fileName=Date.now()+"_"+file.name;
  const filePath="sceneImages/"+fileName;
  file.mv(filePath,async(error)=>{
    if(error){
      console.log(error);
    }
    else{
      const insertScene=`INSERT INTO scenes(scene_name,scene_image,tour_id)
      values('${sceneName}','https://venkatsai.onrender.com/${filePath}','${tourId}');`;
      const dbResponse=await db.run(insertScene);
      const sceneQuery=`SELECT scene_id,scene_name,scene_image,tour_id FROM scenes WHERE scene_id='${dbResponse.lastID}';`;
      const latestScenes=await db.get(sceneQuery);
      const sceneImageUrl=`https://venkatsai.onrender.com/${latestScenes.scene_images}`;
      response.send(latestScenes);
    }
  })
})
// FILTERING THE HOTSPOTS FOR PERTICULAR SCENE....
app.post("/sceneHotspots",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const sceneHotspots=request.body;
  const {id}=sceneHotspots;
  const sceneGroupHotspots=`SELECT hotspot_id,x,y,z,scene_id  FROM hotspots WHERE scene_id='${id}';`;
 const dbResponse=await db.all(sceneGroupHotspots);
 response.send(dbResponse);
})
app.delete("/deleteScene",jsonParser,async(request,response)=>{
  const sceneDeleteInfo=request.body;
  const {id,tourId}=sceneDeleteInfo;
  const deleteScene=`DELETE FROM scenes WHERE scene_id='${id}';`;
  const dbResult=await db.run(deleteScene);
  const deleteResponseQuery=`SELECT * FROM scenes WHERE tour_id='${tourId}';`;
  const selectResponseQuery=await db.all( deleteResponseQuery);
  response.send(selectResponseQuery);
})
app.post("/linkedSpots",jsonParser,async(request,response)=>{
  const linkSpots=request.body;
const{parseActiveSceneId,actionHotspot,parseActiveTourId,targetedSceneId}=linkSpots;
const linkSpotInsertQuery=`INSERT INTO single_hotspot(hotspot_id,orizinated_scene_id,target_scene_id,active_tour_id)
VALUES('${actionHotspot}','${parseActiveSceneId}','${targetedSceneId}','${parseActiveTourId}');`;
const dbResponse=await db.run(linkSpotInsertQuery);
response.send(dbResponse);
})
// viewer default scene
app.post("/viewer",jsonParser,async(request,response)=>{
  try{
  const tourIds=request.body;
  const {parseTourId}=tourIds;
  const tourId=`SELECT * FROM single_hotspot WHERE active_tour_id='${parseTourId}';`;
  const dbResponse=await db.all(tourId);
  const initialScene=dbResponse[0].orizinated_scene_id;
  const sceneGetQuery=`SELECT scene_id,scene_name,tour_id,scene_image,map_image FROM scenes WHERE scene_id='${initialScene}';`;
  const firstScene=await db.get(sceneGetQuery);
  const firstHotspots=firstScene.scene_id;
  const gettingHotspots=`SELECT x,y,z,hotspot_id FROM hotspots WHERE scene_id='${firstHotspots}';`;
  const currentSceneHotspots=await db.all(gettingHotspots);
  response.send([firstScene,currentSceneHotspots]);
}
catch(error){
  console.log(error)
}
})
// linked scenes
app.post("/moveingScenes",jsonParser,async(request,response)=>{
  try{
 const hotspotDetails=request.body;
 const {hotspotId}= hotspotDetails;
 const linkSceneQuery=`SELECT * FROM single_hotspot WHERE hotspot_id='${hotspotId}';`;
 const selectedScene=await db.get(linkSceneQuery);
 const targetSceneElement= await selectedScene.target_scene_id;
 const sceneGetQuery=`SELECT * FROM scenes WHERE scene_id='${targetSceneElement}';`;
 const dynamicScene=await db.get(sceneGetQuery);
 const movedSceneName=dynamicScene.scene_id;
 const gettingHotspots=`SELECT x,y,z,hotspot_id FROM hotspots WHERE scene_id='${movedSceneName}';`;
  const currentSceneHotspots=await db.all(gettingHotspots);
 response.send([dynamicScene,currentSceneHotspots]);
 response.status(200);
  }
  catch(error){
    console.log(error)
  }
  
})

app.post("/mapImage",jsonParser,async(request,response)=>{
  const file=request.files.mapFile;
  const activeSceneIds=request.body;
  const {activeSceneId}=activeSceneIds;
  const fileName=Date.now()+"_"+file.name;
  const filePath="mapImages/"+fileName;
  file.mv(filePath,async(error)=>{
    if(error){
      console.log(error)
    }
    else{
      const mapInsertQuery=  ` UPDATE scenes
      SET map_image = 'https://venkatsai.onrender.com/${filePath}'
      WHERE scene_id = '${activeSceneId}';`;
      const dbResponse=await db.run(mapInsertQuery);
      const getMapImage=`SELECT map_image FROM scenes WHERE scene_id='${activeSceneId}';`;
      const mapImageget=await db.get(getMapImage);
      response.send(mapImageget);
    }
})
})

app.post("/getmapImage",jsonParser,async(request,response)=>{
  const sceneIdReques=request.body;
  const {id}=sceneIdReques;
  const mapImageQuery=`SELECT map_image FROM scenes WHERE scene_id='${id}';`;
  const mapImage=await db.get(mapImageQuery);
  response.send(mapImage);
})
app.post("/tourData1",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const tourId=request.body;
  const {userNumber}=request;
  const {parseTourId}=tourId;
  const virtualTourQuery=`SELECT * FROM virtual_tours LEFT JOIN designerPost ON virtual_tours.tour_id=designerPost.tourId WHERE user_id='${userNumber}';`;
  const dbResponse=await db.all(virtualTourQuery);
  response.send(dbResponse);
 })
 app.post("/deleteTour",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const tourId=request.body;
   const {tour_id}=tourId;
   const {userNumber}=request;
  const virtualTourQuery=`DELETE FROM virtual_tours WHERE tour_id=${tour_id};`;
  const dbResponse=await db.run(virtualTourQuery);
  const deleteFeedData=`DELETE FROM designerPost WHERE tourId=${tour_id};`;
  await db.run(deleteFeedData);
  const selectVirtualTourQuery=`SELECT * FROM virtual_tours WHERE user_id=${userNumber};`;
  const dbResponseTour=await db.all(selectVirtualTourQuery);
  response.send(dbResponseTour);
 })
 app.post("/editScenes",jsonParser,async(request,response)=>{
  const selectedTour=request.body;
  const {parseTourId}=selectedTour;
  const editSceneQuery=`SELECT * FROM scenes WHERE tour_id=${parseTourId};`;
  const dbResonse=await db.all(editSceneQuery);
  response.send(dbResonse);
 })
 //upload images
 app.post("/postImage",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const subCategory=null;
  const likes=1;
  const {userNumber}=request;
  const { feedImages } = request.files;
  const postDeatils=request.body;
  const {caption,designStyle,propertyType,location,occupancy,propertySize,duration,tags,privacyState}=postDeatils;
  const gettingDesignerID=`SELECT designer_id,desigener_name,logo FROM interior_designer_details WHERE phone_number='${userNumber}';`;
  const dbResonse=await db.get(gettingDesignerID);
  const createdDesignerId=dbResonse.designer_id;
  const createdDesignerName=dbResonse.desigener_name;
  const designerLogo=dbResonse.logo;
  if(dbResonse===null){
    response.send("UnAuthorized User");
  }else{
    const fileImageLength=feedImages.length;
    let fileArray=[];
   if(fileImageLength>1){
    for (let i = 0; i < fileImageLength; i++) {
      const file=request.files.feedImages[i];
      const fileName=Date.now()+"_"+file.name;
      const filePath="feedUploads/"+fileName;
      file.mv(filePath);
      const filePathArray=fileArray.push(filePath);
    }
   }
   else{
    const file=request.files.feedImages;
    const fileName=Date.now()+"_"+file.name;
    const filePath="feedUploads/"+fileName;
    file.mv(filePath);
    const filePathArray=fileArray.push(filePath);
  }
  const postInsertQuery=`INSERT INTO designerPost (designerId,postType,designStyle,category,subCategory,caption,privacy,likes,thumbnail,isActive,location,createdAt,updatedAt,occupancy,propertySize,duration,tags,deignerName,logo)
       VALUES('${createdDesignerId}','image','${designStyle}','${propertyType}','${subCategory}','${caption}','${privacyState}','${likes}','${fileArray} ','${false}','${location}','${Date.now()}','${null}','${occupancy}','${propertySize}','${duration}','${tags}','${createdDesignerName}','${designerLogo}');`;
      const insertingValuesintoDb=await db.run(postInsertQuery);
       response.send("Post is Uploaded Successfully");
    }
} )  
//upload videos
app.post("/postVideo",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const subCategory=null;
  const likes=1;
  const {userNumber}=request;
  const { feedImages,videoUpload } = request.files;
  const postDeatils=request.body;
  const {caption,designStyle,propertyType,location,occupancy,propertySize,duration,tags,privacyState}=postDeatils;
  const gettingDesignerID=`SELECT designer_id,desigener_name FROM interior_designer_details WHERE phone_number='${userNumber}';`;
  const dbResonse=await db.get(gettingDesignerID);
  const createdDesignerId=dbResonse.designer_id;
  const createdDesignerName=dbResonse.desigener_name; 
  if(dbResonse===null){
    response.send("UnAuthorized User");
  }else{
    const fileImageLength=videoUpload.length;
    let fileArray=[];
   if(fileImageLength>1){
    for (let i = 0; i < fileImageLength; i++) {
  const file=request.files.videoUpload[i];
  const fileName=Date.now()+"_"+file.name;
  const filePath="feedUploads/"+fileName;
  file.mv(filePath);
  const filePathArray=fileArray.push(filePath);
    }
  }
  else{
    const file=request.files.videoUpload;
    const fileName=Date.now()+"_"+file.name;
    const filePath="feedUploads/"+fileName;
    file.mv(filePath);
    const filePathArray=fileArray.push(filePath);
  }
      const postInsertQuery=`INSERT INTO designerPost (designerId,postType,designStyle,category,subCategory,caption,privacy,likes,thumbnail,isActive,location,createdAt,updatedAt,occupancy,propertySize,duration,tags,deignerName)
      VALUES('${createdDesignerId}','video','${designStyle}','${propertyType}','${subCategory}','${caption}','${privacyState}','${likes}','${fileArray}','${false}','${location}','${Date.now()}','${null}','${occupancy}','${propertySize}','${duration}','${tags}','${createdDesignerName}');`;
      const insertingValuesintoDb=await db.run(postInsertQuery);
     response.send("Post is Uploaded Successfully");
}
} )            
// post's Based on profiles
app.get("/profileAllposts",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request;
  console.log('triggered')
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber} ;`;
  const designerResponse=await db.get(getDesigner);
  const DesignerId1=designerResponse.designer_id;
  const getAllPosts=`SELECT * FROM designerPost WHERE designerId=${DesignerId1} ORDER BY createdAt DESC;`;
  const postResponse=await db.all(getAllPosts);
  const getPostsCount=`SELECT COUNT(*) AS postCount FROM designerPost WHERE designerId=${DesignerId1} ORDER BY createdAt DESC;`;
  const postCountResponse=await db.get(getPostsCount);
  const designerPostDetails=JSON.stringify({postResponse,postCountResponse})
  response.send(designerPostDetails);
})
app.post("/designerPost",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {selectedPostId}=request.body;
  const {userNumber}=request;
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber} ;`;
  const designerResponse=await db.get(getDesigner);
  const DesignerId1=designerResponse.designer_id;
  const getAllPosts=`SELECT * FROM designerPost WHERE designerId=${DesignerId1} ORDER BY CASE
  WHEN postId=${selectedPostId} THEN 0 ELSE 1 END,
  postId;`;
  const postResponse=await db.all(getAllPosts);
  response.send(postResponse);
  console.log(postResponse,"zmd;kasmd")
})
app.post("/designerSelectedPost",userJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {selectedPostId1}=request.body;
  const getAllPosts=`SELECT * FROM designerPost WHERE postId=${selectedPostId1} ;`;
  const postResponse=await db.all(getAllPosts);
  response.send(postResponse);
})

app.post("/savedPosts",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {selectedPostId1}=request.body;
  const getAllPosts=`SELECT * FROM designerPost WHERE postId=${selectedPostId1} ;`;
  const postResponse=await db.all(getAllPosts);
  response.send(postResponse);
})

app.get("/360ImagesOnProfile",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request;
  const get360Posts=`SELECT * FROM virtual_tours WHERE user_id=${userNumber} ;`;
  const postResponse=await db.all(get360Posts);
  response.send(postResponse);
})
app.post("/likesCount",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {postId,likeButton}=request.body;
  const role=request.headers["role"]
  const {userNumber}=request;
  const likedUserId=role==3? `SELECT userId AS designer_id  FROM usersDetails WHERE mobile=${userNumber} And role=${3};`:( `SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber} ;`)
  const postResponse=await db.all(likedUserId);
  const designerId=postResponse[0].designer_id;
  const insertLikes=likeButton?(`INSERT INTO likes(postId,userId,createdAt,updatedAt,role)
  VALUES('${postId}','${designerId}','${Date.now()}','null',${role});`):`Delete FROM likes WHERE postId=${postId} AND userId=${designerId} AND role=${role} `;
  const insertLikesResponse=await db.run(insertLikes);
  response.send(insertLikesResponse);
})
app.post("/savedPost",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {postId}=request.body;
  const {userNumber}=request;
  const likedUserId=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber} ;`;
  const postResponse=await db.all(likedUserId);
  const designerId=postResponse[0].designer_id;
  const insertSavedPosts=`INSERT INTO savedPosts(postId,userId)
  VALUES('${postId}','${designerId}');`;
  const savedPosts=await db.run(insertSavedPosts);
  response.send(savedPosts);
  
})
app.post("/deleteSavedPost",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {postId}=request.body;
  const {userNumber}=request;
  const likedUserId=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber} ;`;
  const postResponse=await db.all(likedUserId);
  const designerId=postResponse[0].designer_id;
  const deleteSavedPost=`DELETE FROM savedPosts WHERE userId='${designerId}' AND postId='${postId}';`;
  const deleteResponse=await db.run(deleteSavedPost);
  console.log("delete")
})
//saved posts
app.get("/getSavedPost",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request;
  let postArray=[];
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber} ;`;
  const designerResponse=await db.get(getDesigner);
  const DesignerId1=designerResponse.designer_id;
  const getAllPosts=`SELECT postId FROM savedPosts WHERE userId=${DesignerId1} ORDER BY savedDesignId DESC; `;
  const postResponse=await db.all(getAllPosts);

  const postResponseLength=postResponse.length-1
  postResponse.forEach(element => {
    postArray.push(element.postId);
   
  });
  const savedPostData=`SELECT * FROM designerPost WHERE postId IN (${postArray});`;
  const dbResponse=await db.all(savedPostData)
  response.send(dbResponse)
})
//venor Signup

app.post("/venderSignup",jsonParser,async(request,response)=>{
  const{name,address,email,area,bankName,accountNumber,branch,ifscCode,PhoneNumber,teamSize,city ,gstNumber,selectedOptions,venderType}=request.body
  const checkingVendor=`SELECT mobile FROM usersDetails WHERE mobile=${PhoneNumber} ;`;
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
  }
})
app.post("/vendorProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
 const {title,description,descriptionStatus,titleStatus,thickness,length,width,productType,brand,sqFeets,fettInput,productColor,material,selectType,spaceType,usage,qty,price,tax,noOfDays,shippingCharges}=request.body
 const { productImages } = request.files;
 const {userNumber}=request
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
app.get('/exploreStoreProducts',jsonParser,async(request,response)=>{
  const getProducts=` SELECT *
  FROM products
  LEFT JOIN prouctBrand
  ON products.productBrandId= prouctBrand.productBrandId  ;`;
  const exploreProducts=await db.all(getProducts)
  response.send(exploreProducts)
  console.log(exploreProducts)
})

app.post("/storeProducts",jsonParser,async(request,response)=>{
  const {materialName}=request.body
  const getProducts=`SELECT productId,title,description,name,thumbnail
  FROM products
  LEFT JOIN productType
  ON products.productTypeId= productType.productTypeId WHERE name='${materialName}';`;
  products=await db.all(getProducts);
  response.send(products)
})
app.get("/material",jsonParser,async(request,response)=>{
  const getMaterial=`SELECT productTypeId,name FROM productType;`;
  const material=await db.all(getMaterial)
  response.send(material)
})

app.post("/productDetailview",jsonParser,async(request,response)=>{
  const {productId}=request.body
  const getProductDetails=`SELECT productId,title,description,productType,name,productSize,usages,quantity,price,tax,shippingCharges,estimateDeliviry,thumbnail,brandName,color,material FROM products LEFT JOIN productType ON products.productTypeId=productType.productTypeId LEFT JOIN prouctBrand ON products.productBrandId=prouctBrand.productBrandId LEFT JOIN productcolor ON products.productColorId=productcolor.productColorId LEFT JOIN productmaterial ON products.productMaterialId=productmaterial.productMaterialId WHERE productId='${productId}';`;
  const productDetails=await db.get(getProductDetails);
  response.send(productDetails)
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
   }
  const postInsertQuery=`INSERT INTO designerPost (designerId,postType,designStyle,category,subCategory,caption,privacy,likes,thumbnail,isActive,location,createdAt,updatedAt,occupancy,propertySize,duration,tags,deignerName,logo,tourId)
       VALUES('${createdDesignerId}','virtualTourImage','${designStyle}','${propertyType}','${subCategory}','${tourTitle}','${privacy}','${likes}','${fileArray} ','${false}','${location}','${Date.now()}','${null}','${occupancy}','${propertySize}','${timeDuration}','${tags}','${createdDesignerName}','${designerLogo}','${presentTourd}');`;
      const insertingValuesintoDb=await db.run(postInsertQuery)
       response.send("Post is Uploaded Successfully")
}
} )  
app.post("/virtualTourDetailview",jsonParser,async(request,response)=>{
  const {currentTourId}=request.body
  const joinQuery=`SELECT * FROM designerPost LEFT JOIN virtual_tours ON designerPost.tourId=virtual_tours.tour_id WHERE tour_id='${currentTourId}';`;
  const dbResponse=await db.get(joinQuery);
  response.send(dbResponse)
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
  dbQuery=`SELECT * FROM usersDetails WHERE mobile='${phoneNumber}' AND role='${2}';`;
  const dbResponse=await db.get(dbQuery)
  if(dbResponse===undefined){
    response.status(404)
    response.send({"error_msg":"Mobile number is not Registered"})  
  }
  else{
    //creating jsonweb token
    const payload={phoneNumber:phoneNumber,}
    const jwtToken=jwt.sign(payload,"user_login_token")
    response.send({jwtToken})
  }
})
app.post("/createProject",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {projectName}=request.body
  const {userNumber}=request
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber};`;
  const deResponse=await db.get(getDesigner)
  const designerId=deResponse.designer_id
  const projectDataQuery=`INSERT INTO projects (title,designerId,userId,status,createdAt)
  VALUES('${projectName}','${designerId}','${1}','upcoming','${Date.now()}');`;
  const responeProject=await db.run(projectDataQuery);
  response.send(JSON.stringify('Project Created Successfully'))
})
app.get("/ongoingProjects",jwtAuthenticateToken,async(request,response)=>{
  const {userNumber}=request
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number='${userNumber}';`;
  const deResponse=await db.get(getDesigner)
  const designerId=deResponse.designer_id
  const ongoingProjectsData=`SELECT projectId,title,designerId,userId,status,createdAt,updatedAt FROM projects WHERE designerId=${designerId} AND status='ongoing';`;
  const responseProjects=await db.all(ongoingProjectsData);
  response.send(responseProjects)
})
app.get("/upcomingProjects",jwtAuthenticateToken,async(request,response)=>{
  const {userNumber}=request
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number='${userNumber}';`;
  const deResponse=await db.get(getDesigner)
  const designerId=deResponse.designer_id
  const ongoingProjectsData=`SELECT projectId,title,designerId,userId,status,createdAt,updatedAt FROM projects WHERE designerId=${designerId} AND status='upcoming';`;
  const responseProjects=await db.all(ongoingProjectsData);
  response.send(responseProjects)
})
//create spacess

// app.post('/createSpaces', async (req, res) => {
//   const {spaceImage}=req.body
//   console.log(req.body.spaceImage)
//   // try {
//   //   // Access the base64-encoded image data from req.body
//   //   const base64Data = req.body.spaceImage.replace(/^data:image\/\w+;base64,/, '');
//   //   const imageBuffer = Buffer.from(base64Data, 'base64');
    
//   //   // Save the image to the 'spaces' folder (you can adjust the path and filename)
//   //   const imageName = `space/image_${Date.now()}.jpg`;
//   //   const imagePath = path.join(__dirname, 'spaces', imageName);
//   //   await fs.writeFile(imagePath, imageBuffer);

//   //   // Insert data into SQLite database
//   //   const spacename = req.body.spacename;
//   //   const projectId = req.body.projectId;
   

//   //   db.run('INSERT INTO projectSpace (spaceImage, spaceName, projectId) VALUES (?, ?, ?)', [imageName, spacename, projectId], (err) => {
//   //     if (err) {
//   //       console.error('Error inserting data into the database:', err);
//   //       res.status(500).json({ error: 'Internal server error' });
//   //     } else {
//   //       res.json({ message: 'Image and data inserted successfully' });
//   //     }
//   //   });
//   // } catch (error) {
//   //   console.error('Error handling image upload:', error);
//   //   res.status(500).json({ error: 'Internal server error' });
//   // }
// });


app.post('/createSpaces', jsonParser,async (req, res) => {
  const {spacename,projectId,spaceImage}=req.body
  try {
    // Access the base64-encoded image data from req.body
    const base64Data = req.body.spaceImage.replace(spaceImage, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    console.log(imageBuffer,"imageBuffer")

    // Save the image to disk (you can adjust the path and filename)
    const imagePath = path.join('spaces', 'image.jpg');
    console.log(imagePath)
    await fs.writeFile(imagePath, imageBuffer);

    // Send a response indicating success
    const insertSpaceDetails=`INSERT INTO projectSpace (projectId,spaceName,createdAt,spaceImage)
          VALUES('${projectId}','${spacename}','${Date.now()}','https://venkatsai.onrender.com/${imagePath}');`;
          const dbResponse=await db.run(insertSpaceDetails);
          const selectSpaces=`SELECT * FROM projectSpace WHERE projectId='${projectId}';`;
      const spaceResponse=await db.all(selectSpaces)
      res.send(spaceResponse)
  } catch (error) {
    console.error('Error handling image upload:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// app.post("/createSpaces",jsonParser,async(request,response)=>{
//   const {spacename,projectId}=request.body
//   // const {spaceImage}=request.files
//   const file=request.files.spaceImage
//   console.log(request.files,'fileeeee')
//   const fileName=Date.now()+"_"+file.name
//   const filePath="spaces/"+fileName
//   console.log(filePath)
//   file.mv(filePath,async(error)=>{
//     if(error){
//       console.log(error)
//     }
//     else{
//       const insertSpaceDetails=`INSERT INTO projectSpace (projectId,spaceName,createdAt,spaceImage)
//       VALUES('${projectId}','${spacename}','${Date.now()}','${filePath}');`;
//       const dbResponse=await db.run(insertSpaceDetails);
//       const selectSpaces=`SELECT * FROM projectSpace WHERE projectId='${projectId}';`;
//   const spaceResponse=await db.all(selectSpaces)
//   response.send(spaceResponse)
   

//     }
// })
// })
app.post("/spaceCards",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {projectId}=request.body
  console.log(projectId,'projectId')
  const selectSpaces=`SELECT * FROM projectSpace WHERE projectId='${projectId}';`;
  const dbResponse=await db.all(selectSpaces)
  response.send(dbResponse)
  console.log(dbResponse,"dbResponse...")
})
app.get("/projectsInStore",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number='${userNumber}';`;
  const deResponse=await db.get(getDesigner)
  const designerId=deResponse.designer_id
  const getAllProjects=`SELECT * FROM projects WHERE designerId='${designerId}' AND status='ongoing';`;
  const projectResponse=await db.all(getAllProjects);
  response.send(projectResponse)
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
  WHERE productId='${productId}';`
  const updateQueryResult=await db.run(updateQuentity);
  response.status(200)
  response.send(dbResponse)
 
}) 
app.post("/spaceProducts",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {spaceId}=request.body
  const joinQuery=`SELECT *, projectSpace.spaceId AS projectSpaceId,projectSpaceProducts.spaceId AS spacesId FROM products LEFT JOIN   projectSpaceProducts ON products.productId=projectSpaceProducts.productId LEFT JOIN projectSpace ON projectSpaceProducts.spaceId=projectSpace.spaceId WHERE spacesId='${spaceId}';`;
  const dbResponse=await db.all(joinQuery)
  response.send(dbResponse)
}) 
app.get("/estimateProjectList",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const getDesigner=`SELECT  designer_id FROM interior_designer_details WHERE phone_number='${userNumber}';`;
  const deResponse=await db.get(getDesigner)
  const designerId=deResponse.designer_id
  const projectListQuery=`SELECT * FROM projects WHERE designerId=${designerId};`;
  const projectList=await db.all(projectListQuery);
  response.send(projectList)
})
app.post("/estimateProducts",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  let spaceIdArray=[]
  const {projectId}=request.body
  const joinQuery=`SELECT *, projectSpace.spaceId AS projectSpaceId,projectSpaceProducts.spaceId AS spacesId FROM products LEFT JOIN   projectSpaceProducts ON products.productId=projectSpaceProducts.productId LEFT JOIN projectSpace ON projectSpaceProducts.spaceId=projectSpace.spaceId WHERE spacesId IN (SELECT spaceId FROM projectSpace WHERE projectId='${projectId}') ORDER BY spaceName ASC;`;
  const dbResponse=await db.all(joinQuery)
  response.send(dbResponse)
 
  
})

app.get("/estimateDesignerDetails",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const getDesigner=`SELECT * FROM interior_designer_details WHERE phone_number='${userNumber}';`;
  const dbResponse=await db.get(getDesigner)
  response.send(dbResponse)
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
})
app.get("/vendoractiveProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
 const vendorIdQuery=`SELECT userId FROM usersDetails WHERE mobile=${userNumber} AND role=${1};`;
  const responseVendorId=await db.get(vendorIdQuery);
  const vendorId=responseVendorId.userId
  const allProducts=`SELECT * FROM products WHERE createdBy='${vendorId}' AND status='active';`;
  const productsResponse=await db.all(allProducts);
  response.send(productsResponse)
})
app.get("/vendorpausedProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const vendorIdQuery=`SELECT userId FROM usersDetails WHERE mobile=${userNumber} AND role=${1};`;
   const responseVendorId=await db.get(vendorIdQuery);
   const vendorId=responseVendorId.userId
   const allProducts=`SELECT * FROM products WHERE createdBy='${vendorId}' AND status='paused';`;
   const productsResponse=await db.all(allProducts);
   response.send(productsResponse)
})
app.get("/vendorDeletedProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const vendorIdQuery=`SELECT userId FROM usersDetails WHERE mobile=${userNumber} AND role=${1};`;
   const responseVendorId=await db.get(vendorIdQuery);
   const vendorId=responseVendorId.userId
   const allProducts=`SELECT * FROM products WHERE createdBy='${vendorId}' AND status='delete';`;
   const productsResponse=await db.all(allProducts);
   response.send(productsResponse)
})
app.put("/pausedProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {productid}=request.body
  const updateStatus=`UPDATE products
  SET status = 'paused'
  WHERE productId = '${productid}';`;
  const dbResonse=await db.run(updateStatus)
})           
app.put("/deleteProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {productid}=request.body
  const updateStatus=`UPDATE products
  SET status = 'delete'
  WHERE productId = '${productid}';`;
  const dbResonse=await db.run(updateStatus)
})  
app.put("/restoreProducts",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const { productId}=request.body
  const updateStatus=`UPDATE products
  SET status = 'active'
  WHERE productId = '${productId}';`;
  const dbResonse=await db.run(updateStatus)
  response.send(JSON.stringify("Restored successfully"))
}) 
app.get("/vendorProfile",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const vendorIdQuery=`SELECT userId FROM usersDetails WHERE mobile=${userNumber} AND role=${1};`;
  const responseVendorId=await db.get(vendorIdQuery);
  const vendorId=responseVendorId.userId
  const designerDetails=`SELECT *, usersDetails.userId AS vendorsId FROM usersDetails LEFT JOIN bankdetails ON usersDetails.userId=bankdetails.userId WHERE vendorsId=${vendorId};`;
  const dbResponse=await db.all(designerDetails);
  response.send(dbResponse)
})
app.post("/designersProfile",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {designerProfileId}=request.body
  const designerQuery=`SELECT * FROM interior_designer_details WHERE designer_id='${designerProfileId}';`;
  const dbResonse=await db.get(designerQuery)
  response.send(dbResonse)
 })
app.post("/otherDesignerProfilePosts",jwtAuthenticateToken,async(request,response)=>{
  const {designerProfileId}=request.body;
 const designerPosts=`SELECT * FROM designerPost WHERE designerId=${designerProfileId};`;
 const dbResponse=await db.all(designerPosts);            
 response.send(dbResponse);
})

app.post("/selectedProfilePosts",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {designerProfileId,selectedPostIds}=request.body;
  const designerPosts=`SELECT * FROM designerPost WHERE designerId=${designerProfileId} ORDER BY CASE
  WHEN postId=${selectedPostIds} THEN 0 ELSE 1 END,
  postId;`;
  const dbResponse=await db.all(designerPosts);
  response.send(dbResponse);
})
app.get("/filterdData",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {type}=request.query
  const designerPosts=`SELECT * FROM designerPost WHERE postType='${type}' OR postType=${null};`;
  const dbResponse=await db.all(designerPosts);
  response.send(dbResponse)
})
app.delete("/deleteSpaceProducts",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {spaceProductId,spaceId}=request.query
  const productDeleteQuery=`DELETE FROM projectSpaceProducts WHERE projectSpaceProductId='${spaceProductId}';`;
  const dbResponse=await db.run(productDeleteQuery)
  const joinQuery=`SELECT *, projectSpace.spaceId AS projectSpaceId,projectSpaceProducts.spaceId AS spacesId FROM products LEFT JOIN   projectSpaceProducts ON products.productId=projectSpaceProducts.productId LEFT JOIN projectSpace ON projectSpaceProducts.spaceId=projectSpace.spaceId WHERE spacesId='${spaceId}';`;
  const productResponse=await db.all(joinQuery)
  response.send(productResponse)
})
app.put("/quentitySpaceProducts",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {spaceProductId,spaceId,quentity}=request.query
  const updateQuentity=`UPDATE projectSpaceProducts
  SET quentity ='${quentity}' WHERE projectSpaceProductId =${spaceProductId};`;
  const updateQuentityRespone=await db.run(updateQuentity)
  const joinQuery=`SELECT *, projectSpace.spaceId AS projectSpaceId,projectSpaceProducts.spaceId AS spacesId FROM products LEFT JOIN   projectSpaceProducts ON products.productId=projectSpaceProducts.productId LEFT JOIN projectSpace ON projectSpaceProducts.spaceId=projectSpace.spaceId WHERE spacesId='${spaceId}';`;
  const productResponse=await db.all(joinQuery)
  response.send(productResponse)
})
//to chat profile
app.post("/chatProfile",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {profileId}=request.query
  const profileQuery=`SELECT * FROM interior_designer_details WHERE designer_id='${profileId}';`;
  const chatProfile=await db.get(profileQuery)
  response.send(chatProfile)
})
//vendor product detail view, getting the values to edtproduct
app.post("/vendorproductDetailview",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {productId}=request.query 
  const getProductDetails=`SELECT * FROM products LEFT JOIN productType ON products.productTypeId=productType.productTypeId LEFT JOIN prouctBrand ON products.productBrandId=prouctBrand.productBrandId LEFT JOIN productcolor ON products.productColorId=productcolor.productColorId LEFT JOIN productmaterial ON products.productMaterialId=productmaterial.productMaterialId WHERE productId='${productId}';`;
  const productDetails=await db.get(getProductDetails);
  const similarProducts=`SELECT * FROM products WHERE productTypeId=${productDetails.productTypeId};`;
  const similarProductsResponse=await db.all(similarProducts);
  response.send({productDetails:productDetails,similarProducts:similarProductsResponse})
  console.log({productDetails:productDetails,similarProducts:similarProductsResponse})
})
//Vendor Edit product
app.put("/vendorEditProduct/:productId/",vendorJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {productId}=request.params
  const editProductId=parseInt(productId)
  const {title,description,thickness,length,width,productTypeName,productType,brand,sqFeets,fettInput,productColor,material,selectType,spaceType,usages,qty,price,tax,noOfDays,shippingCharges}=request.body
  const selectBrandId=`SELECT productBrandId FROM prouctBrand WHERE brandName='${brand}';`;
  const getBrandId=await db.get(selectBrandId);
  const brandId=getBrandId.productBrandId
  const selectColorId=`SELECT productColorId FROM productcolor WHERE color='${productColor}';`;
  const getColorId=await db.get(selectColorId);
  const colorId=getColorId.productColorId
  const selectProductTypeId=`SELECT productTypeId FROM productType WHERE name='${productTypeName}';`;
  const getProductTypeId=await db.get(selectProductTypeId);
  const productTypeId=getProductTypeId.productTypeId
  const selectMaterialId=`SELECT productMaterialId FROM productmaterial WHERE material='${material}';`;
  const getMaterialId=await db.get(selectMaterialId);
  const productMaterialId=getMaterialId.productMaterialId
 const updateQuery=`UPDATE products SET title='${title}',description='${description}',productBrandId='${brandId}',productColorId='${colorId}',productTypeId='${productTypeId}',productMaterialId='${productMaterialId}',productSize='${fettInput} ${sqFeets}',productType='${productType}',usages='${usages}',quantity='${qty}',price='${price}',tax='${tax}',shippingCharges='${shippingCharges}',estimateDeliviry='${noOfDays}',updatedAt='${Date.now()}',thickness='${thickness}',length='${length}',width='${width}' WHERE productId='${editProductId}';`;
 const productDbResponse=await db.run(updateQuery);
 response.send("Edit Successful")
})
app.post("/exploreSearch",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const searchingInput=request.query.searchInput
  const desktopTabItemsId=request.query.tabId
  const explorEquery=`SELECT * FROM designerPost WHERE designStyle LIKE '%${searchingInput}%' OR category LIKE '%${searchingInput}%' OR caption LIKE '%${searchingInput}%' OR location LIKE '%${searchingInput}%' OR occupancy LIKE '%${searchingInput}%' OR propertySize LIKE '%${searchingInput}%' OR tags LIKE '%${searchingInput}%' OR deignerName LIKE '%${searchingInput}%';`;
  const dbResponse=await db.all(explorEquery)
  response.send(dbResponse)
})

app.post("/usersss",async(request,response)=>{
  response.send(JSON.stringify("User is Created Successfully"))
})
app.post("/postPrivacyChange/",jsonParser,async(request,response)=>{
  const {privacy,designerId}=request.query
   const insertQuery=`UPDATE designerPost
  SET privacy = '${privacy}'
  WHERE designerId='${designerId}';`
  const dbResponse=await db.run(insertQuery)
  response.send(JSON.stringify("Privacy status Changed successfully"))
})
// house owner
app.post("/houseOwnerSignup",jsonParser,async(request,response)=>{
  const {email,number,fullName,userName,adderes}=request.body
  const checkingNumbers=`SELECT * FROM usersDetails  WHERE mobile='${number}' AND role='${3}';`;
  const mobileNumberResponse=await db.get(checkingNumbers)
   if(mobileNumberResponse==undefined){
    const insertingDetails=`INSERT INTO usersDetails(name,emailId,mobile,role,address,createdAt)
 VALUES('${userName}','${email}','${number}','${3}','${adderes}','${Date.now()}');`;
 const dbResonse=await db.run(insertingDetails)
 }
  else{
    response.status(400)
    response.send(JSON.stringify("Mobile number is Already Registered"))
  }
})
app.post("/houseOwnerLogin",jsonParser,async(request,response)=>{
  const {phoneNumber}=request.body
  const getNumber=`SELECT mobile FROM usersDetails WHERE mobile=${phoneNumber} AND role= ${3};`
  const dbResponse=await db.get(getNumber)
  if(dbResponse==undefined){
    response.status(404)
  response.send({"error_msg":"Mobile number is not Registered"})
  }
  else{
    const payload={phoneNumber:phoneNumber}
    const jwtToken=jwt.sign(payload,"houseOwnerLogin")
    response.send({jwtToken})
  }
})
const houseownerJwtAuthenticateToken=(request,response,next)=>{
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
    jwt.verify(jwtToken,"houseOwnerLogin",(error,payload)=>{
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
app.post("/deletePost",jsonParser,async(request,response)=>{
  const {postId}=request.query
  const postDeleteQuery=`DELETE FROM designerPost WHERE postId='${postId}';`;
  const dbResponse=await db.run(postDeleteQuery)
  response.send(JSON.stringify("Post Deleted Successfully"))
})
app.get("/userfeedData",houseownerJwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const getDesigner=`SELECT designer_id FROM interior_designer_details WHERE phone_number=${userNumber};`;
  const deResponse=await db.get(getDesigner)
  const userId=deResponse.designer_id
  const feedQuery=`SELECT * , designerPost.postId AS postId ,designerPost.logo AS designerLogo FROM designerPost  LEFT  JOIN 
                  savedPosts ON  designerPost.postId = savedPosts.postId 
                  LEFT JOIN interior_designer_details ON savedPosts.userId = interior_designer_details.designer_id WHERE privacy ='Public'  ORDER BY postId DESC LIMIT 25;`
                  
  // const feedQuery=`SELECT * FROM designerPost  ORDER BY postId DESC LIMIT 25;`;
  const dbResponse=await db.all(feedQuery);
  response.send(dbResponse);
})
//user liked posts
app.get("/userLikedPosts",jwtAuthenticateToken,async(request,response)=>{
  const {userNumber}=request
  const houseOwnerDetailsQuery=`SELECT userId FROM usersDetails WHERE mobile='${userNumber}' AND role='${3}';`;
  const userResponse=await db.get(houseOwnerDetailsQuery);
  const userId=userResponse.userId
  const likedPosts=`SELECT * FROM designerPost WHERE postId IN (SELECT postId FROM likes WHERE userId='${userId}');`;
  const likesResponse=await db.all(likedPosts)
  response.send(likesResponse)
})

app.get("/likesSaveCount",jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const houseOwnerDetailsQuery=`SELECT userId FROM usersDetails WHERE mobile='${userNumber}' AND role='${3}';`;
  const userResponse=await db.get(houseOwnerDetailsQuery);
  const userId=userResponse.userId
  const likedPosts=`SELECT COUNT(*) AS likeCount FROM designerPost WHERE postId IN (SELECT postId FROM likes WHERE userId='${userId}');`;
  const likesResponse=await db.all(likedPosts)
  response.send(likesResponse)
})
app.get('/likesActivity',jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {userNumber}=request
  const houseOwnerDetailsQuery=`SELECT userId FROM usersDetails WHERE mobile='${userNumber}' AND role='${3}';`;
  const userResponse=await db.get(houseOwnerDetailsQuery);
  const userId=userResponse.userId
  const likedPosts=`SELECT postId from likes WHERE userId='${userId}';`;
  const likedPostsResponse=db.all(likedPosts)
  response.send(likedPostsResponse)
  console.log(likedPostsResponse)
})
app.post('/projectEstimation',jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {marginPrice,productId,spaceId}=request.body
  const estimateData=`INSERT INTO projectEstimation(spaceId,productId,margin,createdAt) VALUES ('${spaceId}','${productId}','${marginPrice}','${Date.now()}');`;
  const dbResponse=await db.run(estimateData)
  console.log(dbResponse)
})
app.post('/estimateDataApi',jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {marginArray,priceArray,spaceIdArray,productIdArray}=request.body
  productIdArray.forEach(async(element,index)=>{
  const insertQuery=`INSERT INTO projectEstimation(spaceId,productId,margin,createdAt)
  VALUES('${spaceIdArray[index]}','${productIdArray[index]}','${marginArray[index]}','${Date.now()}');`
  const dbResponse=await db.run(insertQuery)
})
  // const dbResponse=await db.run(insertQuery)
  response.send(JSON.stringify("Estimate Generated Successfully"))
})
app.post('/editEstimationDetails',jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {spaceIdArray}=request.body
  const spaceIds=spaceIdArray.join(',')
 const searchQuery=`SELECT * FROM projectEstimation WHERE spaceId IN (${spaceIds});`;
 const dbResponse=await db.all(searchQuery);
 response.send(dbResponse)
})
app.post('/exploreSelect',jwtAuthenticateToken,jsonParser,async(request,response)=>{
  const {postId,userId}=request.body
  const exploreQuery=`SELECT * FROM designerPost WHERE postId=${postId} ;`;
  const dbResonse=await db.all(exploreQuery)
  console.log(dbResonse,'response')
  response.send(dbResonse)                                               
})
//Explore filter Feed
app.get('/timeFilteredFeed',jwtAuthenticateToken,async(request,response)=>{
  const {timeFilter}=request.query
  console.log(timeFilter)
// const  query=`SELECT * FROM designerPost WHERE DATE(createdAt/ 1000, "unixepoch")= DATE("now", "localtime");`;
// const dbResponse=await db.all(query)
// console.log(dbResponse)
// response.send(dbResponse)
  let query = '';
  let params = [];
  if(timeFilter==='today'){
        query=`SELECT * FROM designerPost WHERE DATE(createdAt/ 1000, "unixepoch")= DATE("now", "localtime");`;
  }
  else if(timeFilter==='week'){
    query=`SELECT * FROM designerPost WHERE strftime("%Y-%w", createdAt / 1000, "unixepoch") = strftime("%Y-%w", "now", "localtime");`;
  }
        else if(timeFilter==='month'){
        query=`SELECT * FROM designerPost WHERE strftime("%Y-%m", createdAt / 1000, "unixepoch") = strftime("%Y-%m", "now", "localtime");`;
      }
      else{

        query = 'SELECT * FROM your_table';
      
    }
    const dbResonse=await db.all(query)
    response.send(dbResonse)
    console.log(dbResonse)
    // db.all(query, params, (err, rows) => {
    //   if (err) {
    //     console.error(err);
    //     res.status(500).send('Internal Server Error');
    //   } else {
    //     console.log("Hellloootoday")
    //     res.json(rows);
    //   }
    // });  
})
app.get('/productColor',jwtAuthenticateToken,async(request,response)=>{
  const brandColorQuery=`SELECT * FROM productcolor`
  const dbResponse=await db.all(brandColorQuery);
  response.send(dbResponse)
})

// app.post("/upload-feed",jsonParser, async (req, res) => {
//   const {profile}=req.body

//   console.log(profile.name,"hgfcbgchg")
//   res.send(JSON.stringify("Success"))
// //   try {
// //     console.log(req.file,'file');
// //     console.log(req.body,'body');


// //     const DirName = `./uploads`;
// //     let URL = `./uploads/SomeImage.` + req.file.originalname.split(".").pop();

// //     fs.mkdir(DirName, { recursive: true }, async (err) => {
// //       if (err) {
// //         return res.status(500).send("Some Error");
// //       } else {
// //         fs.writeFile(URL, req.file.buffer, "ascii", function (err) {
// //           if (err) {
// //             return res.status(500).send("Some Error");
// //           } else {
// //             res.send({ congrats: "data recieved" });
// //           }
// //         });
// //       }
// //     });
// //   } catch (error) {
// //     res.status(500).send("Error");
// //   }
//  });
const storage = multer.diskStorage({
  destination: '/uploads',
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
app.post('/upload', (req, res) => {
  try {
    upload.single('image')(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        // Handle Multer errors
        console.error('Multer error:', error);
        res.status(400).json({ error: 'File upload error' });
      } else if (error) {
        // Handle other errors
        console.error('Other error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        // Continue with your logic
        const { text } = req.body;
        const imagePath = req.file.path;
        // ...
        res.json({ success: true });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// db.run(`
//   CREATE TABLE IF NOT EXISTS posts (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     text TEXT,
//     imagePath TEXT
//   )
// `);

app.post('/upload-feed',jsonParser, upload.single('image'), (req, res) => {
  const { text } = req.body;
  const imagePath = req.file;
  console.log(imagePath,text)
  res.send("Successfull")

  // db.run('INSERT INTO designerPost (postType, thumbnail) VALUES (?, ?)', [text, imagePath], (error) => {
  //   if (error) {
  //     console.error('Error inserting into database:', error);
  //     res.status(500).json({ error: 'Internal Server Error' });
  //   } else {
  //     res.json({ success: true });
  //   }
  // });
});