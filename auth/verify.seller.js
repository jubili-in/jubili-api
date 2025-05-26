const jwt = require('jsonwebtoken'); 
function verifySeller(req, res) { 
    const token = req.cookies.token; 
    if(!token) return res.status(401).json({message: 'Unauthorised Access'}); 


    // verifying logic
     jwt.verify(token, process.env.JWT_SECRET, (err, user) => { 
        if(err) return res.status(403).json({message: 'Token is not valid !!!'}); 
        return res.status(200).json({ 
            auth: true, 
            user,
        }); 
     })
}

module.exports = {verifySeller}; 