import { Suspense, StrictMode } from 'react'
import ReactDOM from 'react-dom/client';
import {HashRouter} from 'react-router-dom';
import App from './layouts/App';

function renderApp() {
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <HashRouter>
                <Suspense fallback={<div>加载中</div>}>
                    <App/>
                </Suspense>
            </HashRouter>
        </StrictMode>
    );
}

export default renderApp;
