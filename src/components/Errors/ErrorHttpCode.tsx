import classes from "style.module.scss"

export default function ErrorHttpCode(
    {
        code,
        title = 'Hey Gamer, we\'ve encountered an unexpected issue!',
        message = 'Our team has been alerted and is actively investigating the issue. Please continue playing or ask support for any questions.'
    }: {
        code: string,
        title: string,
        message: string
    }) {

    return <main role="main">
        <div className={classes.maintenance}>
            <div className={classes.problemBox}>
                <div className={classes.notfound}>
                    <div className={classes.notfound_404}>
                        <h3>{title}</h3>
                        <h1>{code}</h1>
                    </div>
                    <h2>{message}</h2>
                </div>
            </div>
        </div>
    </main>

}



