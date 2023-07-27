
import React from 'react';
import styles from "style.module.scss"

export default function AccessDenied ({children} : {children?: React.ReactNode}) {

        return (
            <div>
                <div className={styles.notfound}>
                    <div className={styles.notfound_404}>
                        <h3>Oops! Access not granted</h3>
                        {children}
                        <h1 style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            fontSize: "252px",
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: "-40px",
                            marginLeft: "-20px",
                            marginTop: "20px"

                        }}><span>4</span><span>0</span><span>3</span></h1>
                    </div>
                </div>
            </div>
        );

}

