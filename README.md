![npm](https://img.shields.io/npm/v/%40carbonorm%2Fcarbonreact)
![License](https://img.shields.io/npm/l/%40carbonorm%2Fcarbonreact)
![Size](https://img.shields.io/github/languages/code-size/carbonorm/carbonreact)
![Documentation](https://img.shields.io/website?down_color=lightgrey&down_message=Offline&up_color=green&up_message=Online&url=https%3A%2F%2Fcarbonorm.dev)
![Monthly Downloads](https://img.shields.io/npm/dm/%40carbonorm%2Fcarbonreact)
![All Downloads](https://img.shields.io/npm/dt/%40carbonorm%2Fcarbonreact)
![Star](https://img.shields.io/github/stars/carbonorm/carbonreact?style=social)

# CarbonReact

CarbonReact is a part of the CarbonORM series. It is a React MySQL ORM that is designed to generate all your boilerplate 
code. 


## Installation

CarbonReact is available on [NPM](https://www.npmjs.com/). You'll need to have [NodeJS](https://nodejs.org/en/) installed
which comes prepackaged with npm (node package manager).

```bash
npm install @carbonorm/carbonreact
```

## Generate Models

The command below will generate the models for the database. The models will be generated in the output directory. We do 
recommend you keep this folder separate from other work. It is also best to track the output directory in your version 
control system. All arguments are optional. If you do not provide them the defaults will be used. The example arguments 
below are the defaults.

```bash
npx generateRestBindings --user root --pass password --host 127.0.0.1 --port 3306 --dbname carbonPHP --prefix carbon_ --output /src/api/rest
```

You can view the [code generated](https://github.com/CarbonORM/CarbonORM.dev/blob/www/src/api/rest/Users.tsx) by
[this command](https://github.com/CarbonORM/CarbonNode/blob/main/scripts/generateRestBindings.ts) in
[this repository](git@github.com:CarbonORM/CarbonNode.git). We use [Handlebars templates](https://mustache.github.io/)
to generate the code.

For more information on CarbonNode and the generations please see the [CarbonNode](https://github.com/CarbonORM/CarbonNode).


## QuickStart Implementation

CarbonReact is designed to be the Bootstrap of your application. It is in charge of managing the state of your application.
ideally once it has mounted it never gets unmounted. In application where this is not possible, you can provide the
`shouldStatePersist` property to the CarbonReact React Component. This will allow you to persist the state of your
application even if the component is unmounted. The behavior of accessing or updating state while the component is 
unknown (undefined) and should be avoided. The example below shows a simple implementation of CarbonReact. Our user 
defined component is in `CarbonORM` which is written to extend the `CarbonReact` class. Your implementation must also 
extend `CarbonORM`.


[index.tsx](https://github.com/CarbonORM/CarbonORM.dev/blob/www/src/index.tsx)

```typescript jsx

import 'react-toastify/dist/ReactToastify.min.css'; // This is required for alerts to work and not break styling

const container = document.getElementById('root');

const root = createRoot(container!);

root.render(<React.StrictMode><CarbonORM /></React.StrictMode>);
```

CarbonReact should be loaded as soon as the page loads. There are plans to allow other alerting systems to be used, but 
for now we use [React Toastify](https://www.npmjs.com/package/react-toastify). It must be required in one of your files 
and typically can be done the root of your project. 


[CarbonORM.tsx](https://github.com/CarbonORM/CarbonORM.dev/blob/www/src/CarbonORM.tsx)

```typescript jsx


export const initialCarbonORMState: typeof initialRestfulObjectsState
    & typeof initialRequiredCarbonORMState
    & iAuthenticate
    & iVersions
    & iUi
    & {} = {
    ...initialVersionsState,
    ...initialRestfulObjectsState,
    ...initialRequiredCarbonORMState,
    ...initialAuthenticateState,
    ...initialUiState,
}

export default class CarbonORM extends CarbonReact<{ browserRouter?: boolean }, typeof initialCarbonORMState> {

    static instance: CarbonORM;

    state = initialCarbonORMState;

    constructor(props) {
        super(props);
        CarbonORM.instance = this;
        CarbonReact.instance = this;
    }

    componentDidMount() {
        Carbons.Get()
        authenticateUser()
    }

    render() {
        console.log("CarbonORM TSX RENDER");

        const {isLoaded, backendThrowable} = this.state;


        if (backendThrowable.length > 0) {

            return <BackendThrowable />

        }

        const reactRouterContext = (children: any) => {

            if (isTest) {

                return <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>

            }

            return <HashRouter>{children}</HashRouter>

        }

        return reactRouterContext(<>
            <CarbonWebSocket url={'ws://localhost:8888/ws'}/>
            <Routes>
                <Route path={UI + "*"}>
                    <Route path={MATERIAL_DASHBOARD + "*"} element={ppr(Dashboard, {})}>
                        <Route path={DASHBOARD + '*'} element={ppr(DashboardPage, {})}/>
                        <Route path={USER_PROFILE + '*'} element={ppr(UserProfile, {})}/>
                        <Route path={TABLES + '*'} element={ppr(TableList, {})}/>
                        <Route path={TYPOGRAPHY + '*'} element={ppr(Typography, {})}/>
                        <Route path={ICONS + '*'} element={ppr(Icons, {})}/>
                        <Route path={MAPS + '*'} element={ppr(Maps, {})}/>
                        <Route path={NOTIFICATIONS + '*'} element={ppr(Notifications, {})}/>
                        <Route path={UPGRADE_TO_PRO + '*'} element={ppr(UpgradeToPro, {})}/>
                        <Route path={'*'} element={<Navigate to={'/' + UI + MATERIAL_DASHBOARD + DASHBOARD}/>}/>
                    </Route>
                    <Route path={MATERIAL_KIT + "*"} element={ppr(MaterialKit, {})}>
                        <Route path={SECTION_NAVBARS + '*'} element={ppr(SectionNavbars, {})}/>
                        <Route path={SECTION_BASICS + '*'} element={ppr(SectionBasics, {})}/>
                        <Route path={SECTION_TABS + '*'} element={ppr(SectionTabs, {})}/>
                        <Route path={SECTION_PILLS + '*'} element={ppr(SectionPills, {})}/>
                        <Route path={SECTION_NOTIFICATIONS + '*'} element={ppr(SectionNotifications, {})}/>
                        <Route path={SECTION_TYPOGRAPHY + '*'} element={ppr(SectionTypography, {})}/>
                        <Route path={SECTION_JAVASCRIPT + '*'} element={ppr(SectionJavascript, {})}/>
                        <Route path={SECTION_COMPLETED_EXAMPLES + '*'} element={ppr(SectionCompletedExamples, {})}/>
                        <Route path={SECTION_LOGIN + '*'} element={ppr(SectionLogin, {})}/>
                        <Route path={LANDING_PAGE + '*'} element={ppr(LandingPage, {})}/>
                        <Route path={SECTION_DOWNLOAD + '*'} element={ppr(SectionDownload, {})}/>
                        <Route path={'*'} element={<Navigate to={'/' + UI + MATERIAL_KIT + SECTION_NAVBARS}/>}/>
                    </Route>
                    <Route path={'*'} element={<Navigate to={'/' + UI + MATERIAL_DASHBOARD}/>}/>
                </Route>
                <Route path={DOCUMENTATION + '*'} element={ppr(Documentation, {})}>
                    <Route path={CARBON_ORM_INTRODUCTION + '*'} element={ppr(CarbonORMIntroduction, {})}/>
                    <Route path={SUPPORT + '*'} element={ppr(Support, {})}/>
                    <Route path={CARBONPHP + '*'} element={ppr(CarbonPHP, {})}/>
                    <Route path={DEPENDENCIES + '*'} element={ppr(Dependencies, {})}/>
                    <Route path={CHANGELOG + "*"} element={ppr(Changelog, {})}/>
                    <Route path={IMPLEMENTATIONS + "*"} element={ppr(Implementations, {})}/>
                    <Route path={LICENSE + "*"} element={ppr(License, {})}/>
                    <Route path={'*'} element={<Navigate to={'/' + DOCUMENTATION + CARBON_ORM_INTRODUCTION}/>}/>
                </Route>
                <Route path="/landing-page" element={ppr(LandingPage, {})}/>
                <Route path={'*'} element={<Navigate to={'/documentation'}/>}/>
            </Routes>
            <ToastContainer
                autoClose={3000}
                draggable={false}
                position="top-right"
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnHover
            />
        </>)

    }
}
```


Our testing tool [Jest](https://www.npmjs.com/package/jest) requires [React Router Dom](https://www.npmjs.com/package/react-router-dom) 
to be in `MemoryRouter` mode. This is because Jest does not have a DOM and therefore cannot render the `HashRouter` or 
`BrowserRouter` component. CarbonReact does not require `React Router Dom` to be installed. You can use any router you
like. The example above uses `HashRouter` which is [necessary as this website](https://stackoverflow.com/questions/71984401/react-router-not-working-with-github-pages) 
hosted for free using [GitHub Pages](https://pages.github.com/).

A folder named [state](https://github.com/CarbonORM/CarbonORM.dev/tree/www/src/state) in the root of your project 
`src/state/` should contain all your state files. These files should be written with the intention of being imported
into your CarbonReact extended component. The example below shows a simple state file that is implemented above. Helper 
functions are also included in the state files. These functions are designed to be used in your React Components. React
stateful operations must be wrapped in a function and thus must not be run during the initial page load.

Updating state is as simple as calling `CarbonORM.instance.setState({})`. The class name `CarbonORM` can be replaced with
any name of your liking. Typically, you will want to use the name of your project. 

[ui.tsx](https://github.com/CarbonORM/CarbonORM.dev/blob/www/src/state/ui.tsx)
```typescript jsx
import CarbonORM from "CarbonORM";


export interface iUi {
    pureWordpressPluginConfigured?: boolean,
    documentationVersionURI: string,
    isLoaded: boolean,
    darkMode: boolean,
}

export const initialUiState: iUi = {
    pureWordpressPluginConfigured: false,
    documentationVersionURI: '0.0.0',
    isLoaded: false,
    darkMode: true,
}


export const switchDarkAndLightTheme = () => {
    CarbonORM.instance.setState({
        darkMode: !CarbonORM.instance.state.darkMode
    });
};
```
