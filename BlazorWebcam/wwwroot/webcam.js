function startVideo(src) {
    console.log("webcam.js: startVideo");

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
            let video = document.getElementById(src);
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
        });
    }

    console.log("webcam.js: startVideo - completed");
}

function getFrame(src, dest, dotNetHelper) {
    let video = document.getElementById(src);
    let canvas = document.getElementById(dest);
    canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);

    let dataUrl = canvas.toDataURL("image/jpeg");

    const code = jsQR(dataUrl, 320, 240);

    if (code) {
        console.log("Found QR code", code);
    } else {
        console.log("No QR code");
    }

    dotNetHelper.invokeMethodAsync('ProcessImage', dataUrl);
}