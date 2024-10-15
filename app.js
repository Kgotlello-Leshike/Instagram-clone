class App {
    constructor() {
        this.$app = document.querySelector("#app");
        this.$firebaseAuthContainer = document.querySelector("#firebaseui-auth-container");
        this.$uploadButton = document.querySelector(".upload-button");
        this.$uploadForm = document.querySelector("#upload-form");
        this.ui = new firebaseui.auth.AuthUI(firebase.auth());

        this.handleAuth();
        this.addEventListeners();
    }

    handleAuth() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.redirectToApp();
            } else {
                this.redirectToAuth();
            }
        });
    }

    handleLogout() {
        firebase.auth().signOut().then(() => {
            this.redirectToAuth();
        }).catch((error) => {
            console.log("ERROR OCCURRED", error);
        });
    }

    redirectToApp() {
        this.$firebaseAuthContainer.style.display = "none";
        this.$app.style.display = "block";
        this.$uploadForm.style.display = "none"; // Ensure upload form is hidden
    }

    redirectToAuth() {
        this.$firebaseAuthContainer.style.display = "block";
        this.$app.style.display = "none";
        this.$uploadForm.style.display = "none"; // Ensure upload form is hidden
        this.ui.start('#firebaseui-auth-container', {
            signInOptions: [
                firebase.auth.EmailAuthProvider.PROVIDER_ID
            ],
            // Other config options....
        });
    }

    addEventListeners() {
        // Ensure the logout button exists before adding the listener
        this.$logoutButton = document.querySelector(".logout-button");
        if (this.$logoutButton) {
            this.$logoutButton.addEventListener("click", (event) => {
                event.preventDefault(); // Prevent the default anchor link behavior
                this.handleLogout();
            });
        } else {
            console.error("Logout button not found in the DOM");
        }
    
        // Ensure the upload button exists before adding the listener
        if (this.$uploadButton) {
            this.$uploadButton.addEventListener("click", (event) => {
                event.preventDefault(); // Prevent default link behavior
                this.showUploadForm();
            });
        } else {
            console.error("Upload button not found in the DOM");
        }
    
        // Ensure the post form exists before adding the listener
        const postForm = document.querySelector("#post-form");
        if (postForm) {
            postForm.addEventListener("submit", (event) => {
                event.preventDefault(); // Prevent default form submission
                this.uploadPost();
            });
        } else {
            console.error("Post form not found in the DOM");
        }
    }
    
    showUploadForm() {
        console.log("Showing upload form...");
        this.$uploadForm.style.display = "block"; // Show the upload form
        this.$app.style.display = "none"; // Hide the main app content
    }

    async uploadPost() {
        const fileInput = document.querySelector("#file-input");
        const captionInput = document.querySelector("#caption-input");

        if (!fileInput.files.length || !captionInput.value) {
            alert("Please select a file and enter a caption.");
            return;
        }

        const file = fileInput.files[0];
        const caption = captionInput.value;
        const user = firebase.auth().currentUser;

        if (!user) {
            alert("User is not authenticated.");
            return;
        }

        try {
            const storageRef = firebase.storage().ref(`posts/${file.name}`);
            const uploadTask = storageRef.put(file);

            uploadTask.on('state_changed', (snapshot) => {
                // Monitor upload progress
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            }, (error) => {
                console.error("Upload failed:", error);
            }, async () => {
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                await firebase.firestore().collection('posts').add({
                    userId: user.uid,
                    caption: caption,
                    photoURL: downloadURL,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert("Post created successfully!");
                this.hideUploadForm(); // Hide form after submission
            });
        } catch (error) {
            console.error("Error creating post:", error);
        }
    }

    hideUploadForm() {
        this.$uploadForm.style.display = "none"; // Hide the upload form
        this.$app.style.display = "block"; // Show the main app content
    }
}

const app = new App();
