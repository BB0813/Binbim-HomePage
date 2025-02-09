const particlesConfig = {
    autoPlay: true,
    background: {
        color: {
            value: "transparent",
        },
        image: "",
        position: "50% 50%",
        repeat: "no-repeat",
        size: "cover",
        opacity: 0
    },
    fullScreen: {
        enable: false,
        zIndex: -1
    },
    interactivity: {
        events: {
            onClick: {
                enable: true,
                mode: "push"
            },
            onHover: {
                enable: true,
                mode: "repulse",
                parallax: {
                    enable: false,
                    force: 60,
                    smooth: 10
                }
            },
            resize: true
        },
        modes: {
            push: {
                quantity: 4
            },
            repulse: {
                distance: 100,
                duration: 0.4
            }
        }
    },
    particles: {
        color: {
            value: "#7F5FFF"
        },
        links: {
            color: {
                value: "#A68EFF"
            },
            consent: true,
            distance: 150,
            enable: true,
            frequency: 1,
            opacity: 0.4,
            shadow: {
                blur: 5,
                color: {
                    value: "#000"
                },
                enable: false
            },
            triangles: {
                enable: false,
                frequency: 1
            },
            width: 1
        },
        move: {
            angle: {
                offset: 45,
                value: 90
            },
            attract: {
                enable: false,
                rotate: {
                    x: 600,
                    y: 1200
                }
            },
            direction: "none",
            enable: true,
            noise: {
                delay: {
                    random: {
                        enable: false,
                        minimumValue: 0
                    },
                    value: 0
                },
                enable: false
            },
            outModes: {
                default: "out",
                bottom: "out",
                left: "out",
                right: "out",
                top: "out"
            },
            random: false,
            size: false,
            speed: 4,
            straight: false,
            trail: {
                enable: false,
                length: 10,
                fill: {
                    color: {
                        value: "#000"
                    }
                }
            },
            vibrate: false,
            warp: false
        },
        number: {
            density: {
                enable: true,
                area: 800,
                factor: 1000
            },
            limit: 0,
            value: 60
        },
        opacity: {
            random: {
                enable: true,
                minimumValue: 0.3
            },
            value: {
                min: 0.3,
                max: 0.5
            },
            animation: {
                count: 0,
                enable: true,
                speed: 1,
                sync: false,
                destroy: "none",
                startValue: "random"
            }
        },
        size: {
            random: {
                enable: true,
                minimumValue: 1
            },
            value: {
                min: 1,
                max: 3
            },
            animation: {
                count: 0,
                enable: true,
                speed: 4,
                sync: false,
                destroy: "none",
                startValue: "random"
            }
        }
    }
};

export default particlesConfig;
