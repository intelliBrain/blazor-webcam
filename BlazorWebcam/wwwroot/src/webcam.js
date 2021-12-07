function startVideo(dotNetHelper, videoElementName, canvasVideoName, canvasTrackName) {
    console.log("webcam.js: startVideo");
    console.log(dotNetHelper);

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            devices.forEach(d => {
                if (d.kind === 'videoinput') {
                    console.log(`deviceId='${d.deviceId}', kind=${d.kind}, label='${d.label}'`);
                }
            });
        });
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let constraintsOBS = {
            video: {
                deviceId: 'b19b18a1b839c7975c14a695abf8626b817cd20b1dc07a310cd0f3d8f3da6e15'    // OBS Virtual Camera
            }
        }

        let constraintsHP = {
            video: {
                deviceId: '8191bb9f3cf5ffcd9a6d7ce6a98f7d82c6bbce3446e638a3c9f17a4ec46cd8b9'    // HP HD Camera (04f2:b5e7)'
            }
        }

        let constraintsVideo = {
            video: true
        }

        navigator.mediaDevices.getUserMedia(constraintsVideo).then((stream) => {
            let video = document.getElementById(videoElementName);
            let canvasVideo = document.getElementById(canvasVideoName);
            let canvasTrack = document.getElementById(canvasTrackName);
            let lastCode = null;
            let lastScan = 0;
            let scanInterval = 250;

            if ("srcObject" in video) {
                video.srcObject = stream;
            } else {
                video.src = window.URL.createObjectURL(stream);
            }
            video.onloadedmetadata = (e) => {
                console.log('video.onloadedmetadata');
                console.log(e);
                video.play();
            };

            //mirror image
            //video.style.webkitTransform = "scaleX(-1)";
            //video.style.transform = "scaleX(-1)";

            requestAnimationFrame((ts) => onAnimationFrame(dotNetHelper, ts, video, canvasVideo, canvasTrack, lastScan, scanInterval, lastCode));
        });
    }

    console.log("webcam.js: startVideo - completed");
}

function stopVideo() {
    console.log("webcam.js: stopVideo");

    console.log("webcam.js: stopVideo - completed");
}

function getFrame(dotNetHelper, src, dest) {
    let video = document.getElementById(src);
    let canvas = document.getElementById(dest);
    let ctx = canvas.getContext('2d');

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
    });

    console.log(`code: ${code}`);
    console.log(code);

    let dataUrl = canvas.toDataURL("image/jpeg");
    dotNetHelper.invokeMethodAsync('ProcessImage', dataUrl);
}

function onAnimationFrame(dotNetHelper, timestamp, video, canvasVideo, canvasTrack, lastScan, scanInterval, lastCode) {
    if (timestamp - lastScan >= scanInterval) {
        lastScan = timestamp;

        let ctx = canvasVideo.getContext('2d');
        ctx.drawImage(video, 0, 0, canvasVideo.width, canvasVideo.height);

        var imageData = ctx.getImageData(0, 0, canvasVideo.width, canvasVideo.height);
        var code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code !== null) {
            if (canvasTrack != null) {
                canvasTrack.width = canvasVideo.width;
                canvasTrack.height = canvasVideo.height;

                // greenyellow = #FFADFF2F
                // red = #FF3B58
                const colorFill = "#90EE9050"; // #90EE90 = lightgreen
                const colorStroke = "#90EE90CC"; // #90EE90 = lightgreen
                const lineWidthStroke = 3;
                drawTrackFrame(
                    canvasTrack,
                    code.location.topLeftCorner,
                    code.location.topRightCorner,
                    code.location.bottomRightCorner,
                    code.location.bottomLeftCorner,
                    colorFill,
                    colorStroke,
                    lineWidthStroke
                );
            }

            let emitEvent = true;
            if (lastCode !== null) {
                if (lastCode.data === code.data) {
                    emitEvent = false;
                }
            }

            if (emitEvent) {
                //console.log(`code: ${code.data}`);
                dotNetHelper.invokeMethodAsync('QRCodeDetected', code.data);
            }

            lastCode = code;
        } else {
            if (lastCode != null) {
                if (canvasTrack != null) {
                    canvasTrack.width = canvasVideo.width;
                    canvasTrack.height = canvasVideo.height;

                    const colorFill = "#00000000";
                    const colorStroke = "#00000000";
                    const lineWidthStroke = 0;
                    drawTrackFrame(
                        canvasTrack,
                        lastCode.location.topLeftCorner,
                        lastCode.location.topRightCorner,
                        lastCode.location.bottomRightCorner,
                        lastCode.location.bottomLeftCorner,
                        colorFill,
                        colorStroke,
                        lineWidthStroke
                    );
                }

                //console.log(`code: **NO CODE **`);
                //dotNetHelper.invokeMethodAsync('QRCodeDetected', '');
                //lastCode = null;
            }
        }
    }

    requestAnimationFrame((ts) => onAnimationFrame(dotNetHelper, ts, video, canvasVideo, canvasTrack, lastScan, scanInterval, lastCode));
}

function drawTrackFrame(canvas, topLeft, topRight, bottomRight, bottomLeft, colorFill, colorStroke, lineWidthStroke) {
    if(canvas != null) {
        const ctx = canvas.getContext("2d");

        if (ctx != null) {
            ctx.beginPath();
            ctx.moveTo(topLeft.x, topLeft.y);
            ctx.lineTo(topRight.x, topRight.y);
            ctx.lineTo(bottomRight.x, bottomRight.y);
            ctx.lineTo(bottomLeft.x, bottomLeft.y);
            ctx.closePath();
            ctx.fillStyle = colorFill;
            ctx.fill();
            ctx.lineWidth = lineWidthStroke;
            ctx.strokeStyle = colorStroke;
            ctx.stroke();
        }
    }
}
