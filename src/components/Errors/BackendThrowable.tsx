import styles from './style.module.scss';
import OutsideClickHandler from 'react-outside-click-handler';

export default function BackendThrowable() {

    const CarbonORM = require('CarbonReact').default;

    const bootstrap = CarbonORM.instance;

    const currentThrowable = bootstrap.state.backendThrowable[0];

    console.log([bootstrap.state.backendThrowable, currentThrowable]);

    return <div className={styles.maintenanceHero}>
        <h1 className={styles.httpStatusCode}>{currentThrowable?.status || 500}</h1>
        <OutsideClickHandler
            onOutsideClick={() => bootstrap.setState(currentState => ({ backendThrowable: currentState.backendThrowable.slice(1) }))}>
            <div className={styles.centeredContainer}>
                {Object.keys(currentThrowable).map((key, index) => {

                    const valueIsString = typeof currentThrowable[key] === 'string';

                    const valueIsCode = 'THROWN NEAR' === key;

                    return <div key={index}>
                        <div className={styles.errorTextGeneral}> &gt; <span className={styles.errorKeys}>{key}</span>:
                            {valueIsString
                                ? (valueIsCode ? <div
                                        style={{ backgroundColor: 'black', fontSize: 'xx-small' }}
                                        dangerouslySetInnerHTML={{ __html: currentThrowable[key] }} /> :
                                    <i className={styles.errorValues}>&quot;{currentThrowable[key]}&quot;</i>)
                                : ''}
                        </div>
                        {valueIsString
                            ? ''
                            :
                            <pre className={styles.errorPre}>{JSON.stringify(currentThrowable[key], undefined, 4)}</pre>}
                    </div>;
                })}
            </div>
        </OutsideClickHandler>
    </div>;

}