function getProfileInfo()
{
	fetch("http://.1.182:3000/api/users/profile", {
		method: "GET",
		credentials: "include"
	})
	.then(response => response.json())
	.then(data => {
		if (data.success == true)
		{
			alert("Profile Loaded Successfully!");
			console.log("Profile Data:", JSON.stringify(data));
		}
		else
			alert("Failed to Load Profile: " + data.message);
	});
}

getProfileInfo();