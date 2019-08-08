//META{"name":"TestGallery"}*//

class TestGallery {
    getName() {
        return "TestGallery";
    }

    getDescription() {
        return "A simple arrow key based image gallery plugin";
    }

    getVersion() {
        return "0.0.1";
    }

    getAuthor() {
        return "PopahGlo#3995";
    }

    get container() {
        return document.querySelector(".da-modal .da-inner");
    }

    get imgWrapper() {
        return document.querySelector(".da-modal .da-imageWrapper");
    }

    get modalImage() {
        return document.querySelector(".da-modal .da-imageWrapper img");
    }

    updateCurImg() {
        document.getElementById("curImg").innerText = this.images.length - this.i;
    }

    updateTotImg() {
        document.getElementById("totImg").innerText = this.images.length;
    }

    async onKeyDown(evt) {
        // Test if modal image viewer is open
        if (this.modalImage) {
            if (evt.key === "ArrowLeft" || evt.key === "ArrowUp") {
                // Load more images if necessary and go back one
                await this.loadImages();
                this.i++;
                this.updateCurImg();

            } else if (evt.key === "ArrowRight" || evt.key === "ArrowDown") {
                // Go forward if possible
                if (this.i > 0) this.i--;
                this.updateCurImg();

            } else if (evt.key === "Escape") {
                this.onModalImageClose();
                return;
            } else return;

            // Update src of modal image
            let img = this.images[this.i],
                src = img.src.substring(0, img.src.lastIndexOf("?"));

            document.querySelector(".da-modal > .da-inner > div > a").href = src;

            this.modalImage.src = src;

            // Hide during loading
            this.container.style.display = "none";
            // Set container to max height to let image load to max height
            this.container.style.height = this.container.style.maxHeight;
            this.container.style.width  = this.container.style.maxWidth;

            this.modalImage.onload = () => {
                let compStyle = window.getComputedStyle(this.modalImage);

                // Set container size relative to max image size calculated
                this.container.style.width = compStyle.width;
                this.container.style.height = "calc(" + compStyle.height + " + 30px)";

                // Show container again
                this.container.style.display = "inherit";
            }
        }
    }

    get messagesScrollBox() {
        return document.querySelectorAll(".da-systemPad")[2];
    }

    getImages() {
        // Get sent images (direct + embed image fields) as array (thanks es6)
        return [...document.querySelectorAll(".da-imageWrapper[href]:not([href='']) > img")];
    }

    calculateIndex() {
        let src = this.modalImage.src;
        for (let i in this.images) {
            if (this.images[i].src.startsWith(src)) {
                this.i = i;
                return;
            }
        }
        this.i = 0;
    }

    // Load new images if necessary
    loadImages() {
        return new Promise(res => {
            if (this.images.length === 0) {
                // First load
                this.images = this.getImages().reverse();
                this.updateTotImg();
                this.calculateIndex();
                this.updateCurImg();
                res();

            } else if (this.i === this.images.length - 1) {
                // Scroll to the top of the message list, wich makes discord load new pics
                this.messagesScrollBox.scrollTop = 0;

                // Wait for images to load
                setTimeout(async() => {
                    let newImgs = this.getImages().reverse();
                    // Add new images in order at the end
                    let added = false
                    for (let img of newImgs) {
                        if (this.images.filter(img2 => img2.src === img.src).length === 0) {
                            added = true;
                            this.images.push(img);
                        }
                    }

                    if (added) {
                        this.updateTotImg();
                        res();
                    } else {
                        // If no images have been found, try to load some again
                        await this.loadImages();
                        res();
                    }
                }, 1000);
            } else {
                // No need to load anything, resolve
                res();
            }
        });
    }

    onMouseDown(evt) {
        if (evt.button === 0) {
            // Is modal open before timeout
            let openBefore = !!this.modalImage;

            setTimeout(() => {
                // If modal is open now => it was just opened
                if (this.modalImage && !openBefore)
                    this.onModalImageOpen();
                // Opposite => it was just closed
                else if (!this.modalImage && openBefore)
                    this.onModalImageClose();
            }, 200);
        }
    }

    async onModalImageOpen() {
        let span = () => document.createElement("span");

        // Create elements with ids;
        let parent = span(), curImg = span(), totImg = span();
        curImg.id = "curImg";
        totImg.id = "totImg";

        // Put elements in parent
        parent.appendChild(curImg);
        parent.appendChild(document.createTextNode("/"));
        parent.appendChild(totImg);

        // Count styling
        parent.style.color = "white";
        parent.style.float = "right";
        parent.style.lineHeight = "30px";

        let src = this.modalImage.src;
        this.modalImage.src = src.substring(0, src.lastIndexOf("?"))

        // Add it to the dom
        document.querySelector(".da-modal > .da-inner > div").appendChild(parent);

        // Max dimensions
        this.container.style.maxHeight = "90vh";
        this.container.style.maxWidth = "80vw";

        // Account for the link and count
        this.imgWrapper.style.maxHeight = "calc(100% - 30px)";
        this.imgWrapper.style.maxWidth = "100%";

        this.modalImage.style.maxHeight = this.modalImage.style.maxWidth = "100%";
        this.modalImage.style.height = this.modalImage.style.width = "auto";

        // Load images, and show counts
        await this.loadImages();

        this.calculateIndex();

        this.updateCurImg();
        this.updateTotImg();
    }

    onModalImageClose() {
        
    }

    start() {
        if (!global.ZeresPluginLibrary) return window.BdApi.alert("Library Missing",`The library plugin needed for ${this.getName()} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`);
        ZLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), "LINK_TO_RAW_CODE");

        this.kdListener = evt => this.onKeyDown(evt);
        this.mdListener = evt => this.onMouseDown(evt);

        window.addEventListener("keydown", this.kdListener);
        window.addEventListener("mousedown", this.mdListener);

        // On server/channel change, reset the saved images
        ZLibrary.PluginUtilities.addOnSwitchListener(() => {
            this.images = [];
        });

        this.images = [];
        this.i = 0;
    }

    stop() {
        window.removeEventListener("keydown", this.kdListener);
        window.removeEventListener("mousedown", this.mdListener);
    }
}