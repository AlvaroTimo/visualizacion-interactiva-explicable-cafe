document.addEventListener('DOMContentLoaded', function() {
    // Referencias a los elementos
    const container = document.querySelector('.container');
    const leftPanel = document.getElementById('left-panel');
    const centerPanel = document.getElementById('center-panel');
    const rightPanel = document.getElementById('right-panel');
    const leftDivider = document.getElementById('left-divider');
    const rightDivider = document.getElementById('right-divider');
    const horizontalDivider = document.getElementById('horizontal-divider');
    const rightTop = document.querySelector('.right-top');
    const rightBottom = document.querySelector('.right-bottom');
    const workspaceContainer = document.getElementById('workspace-container');
    const divisionSelect = document.getElementById('division-select');

    // Estado inicial de los paneles
    let state = {
        leftWidth: 360,
        rightWidth: 300,
        isLeftCollapsed: false,
        isRightCollapsed: false,
        isTopCollapsed: false,
        isBottomCollapsed: false
    };
    
    function updateWorkspaceDivisions() {
        const count = parseInt(divisionSelect.value);
        workspaceContainer.innerHTML = '';
        
        workspaceContainer.className = 'workspace-container';
    
        // Configurar el layout según el número de divisiones
        if (count === 4) {
            workspaceContainer.classList.add('grid-layout');
        } else {
            workspaceContainer.style.flexDirection = 'column';
            workspaceContainer.style.height = '100%';
        }
    
        for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            const windowId = `window${i+1}`;
            
            // Contenedor principal que manejará la dirección del flex
            const containerDiv = document.createElement('div');
            containerDiv.className = count > 1 && count < 4 ? 'horizontal-container' : 'vertical-container';
            
            // Crear la barra de navegación
            const nav = document.createElement('nav');
            nav.className = 'navbar';
            nav.innerHTML = `
                <div class="nav-content ${count > 1 && count < 4 ? 'vertical' : ''}">
                    <button class="zoom-btn" data-window="${windowId}">🔍</button>
                    <ul class="nav-list">
                        <li class="nav-item dropdown">
                            <a href="#" class="dropbtn model-dropbtn" data-window="${windowId}">MODELO</a>
                            <div class="dropdown-content">
                                <a href="#" class="dropdown-option-model" data-window="${windowId}" data-value="VGG19">VGG19</a>
                                <a href="#" class="dropdown-option-model" data-window="${windowId}" data-value="Xception">Xception</a>
                                <a href="#" class="dropdown-option-model" data-window="${windowId}" data-value="ResNet50V2">ResNet50V2</a>
                                <a href="#" class="dropdown-option-model" data-window="${windowId}" data-value="DenseNet201">DenseNet201</a>

                            </div>
                        </li>
                        <li class="nav-item dropdown">
                            <a href="#" class="dropbtn proj-dropbtn" data-window="${windowId}">PROYECCIÓN</a>
                            <div class="dropdown-content">
                                <a href="#" class="dropdown-option-proj" data-window="${windowId}" data-value="UMAP">UMAP</a>
                                <a href="#" class="dropdown-option-proj" data-window="${windowId}" data-value="TSNE">t-SNE</a>
                                <a href="#" class="dropdown-option-proj" data-window="${windowId}" data-value="TRIMAP">TriMap</a>
                                <a href="#" class="dropdown-option-proj" data-window="${windowId}" data-value="PACMAP">PaCMAP</a>
                            </div>
                        </li>
                    </ul>
                </div>
            `;
    
            const canva = document.createElement('div');
            canva.className = 'canva';
    
            div.className = 'workspace-division';
            div.id = windowId;
    
            if (count === 1) {
                div.style.height = '100%';
                window.SIZE_POINT = 4
                window.SIZE_POINT_SELECTED = 8
                window.NUM_WINDOWS = 1
            } else if (count === 2) {
                div.style.height = '50%';
                window.SIZE_POINT = 3
                window.SIZE_POINT_SELECTED = 6
                window.NUM_WINDOWS = 2
            } else if (count === 3) {
                div.style.height = '33.333%';
                window.SIZE_POINT = 2.5
                window.SIZE_POINT_SELECTED = 5
                window.NUM_WINDOWS = 3
            } else {
                window.SIZE_POINT = 2
                window.SIZE_POINT_SELECTED = 3
                window.NUM_WINDOWS = 4
            }
            
            containerDiv.appendChild(nav);
            containerDiv.appendChild(canva);
            div.appendChild(containerDiv);
            workspaceContainer.appendChild(div);
        }
    
        document.querySelectorAll(".dropdown-option-model").forEach(option => {
            option.addEventListener("click", function(event) {
                event.preventDefault();
                const selectedValue = this.getAttribute("data-value");
                const windowId = this.getAttribute("data-window");
                const dropbtn = document.querySelector(`.model-dropbtn[data-window="${windowId}"]`);
                if (dropbtn) {
                    dropbtn.textContent = selectedValue;
                }
                changeModel(selectedValue, windowId);
            });
        });
    
        document.querySelectorAll(".dropdown-option-proj").forEach(option => {
            option.addEventListener("click", function(event) {
                event.preventDefault();
                const selectedValue = this.getAttribute("data-value");
                const windowId = this.getAttribute("data-window");
                const dropbtn = document.querySelector(`.proj-dropbtn[data-window="${windowId}"]`);
                if (dropbtn) {
                    dropbtn.textContent = selectedValue;
                }
                changeProjection(selectedValue, windowId);
            });
        });
    
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const windowId = this.getAttribute('data-window');
                doZoomWindow(windowId);
            });
        });
    
        updateAllWindows();
    }

    function updateDividers() {
        leftDivider.style.left = `${state.leftWidth}px`;
        rightDivider.style.right = `${state.rightWidth}px`;
        horizontalDivider.style.width = `${state.rightWidth}px`;

        leftPanel.style.width = `${state.leftWidth}px`;
        rightPanel.style.width = `${state.rightWidth}px`;

        leftPanel.classList.toggle('collapsed', state.isLeftCollapsed);
        rightPanel.classList.toggle('collapsed', state.isRightCollapsed);
    }

    function handleVerticalResize(e, isLeftDivider) {
        e.preventDefault();
        const divider = isLeftDivider ? leftDivider : rightDivider;
        divider.classList.add('dragging');

        const containerWidth = container.offsetWidth;
        const startX = e.clientX;
        const initialLeftWidth = state.leftWidth;
        const initialRightWidth = state.rightWidth;

        function onMouseMove(e) {
            const deltaX = e.clientX - startX;
            
            if (isLeftDivider) {
                let newLeftWidth = Math.max(0, initialLeftWidth + deltaX);
                newLeftWidth = Math.min(newLeftWidth, containerWidth - state.rightWidth - 15);
                
                state.leftWidth = newLeftWidth;
                state.isLeftCollapsed = newLeftWidth < 20;
            } else {
                let newRightWidth = Math.max(0, initialRightWidth - deltaX);
                newRightWidth = Math.min(newRightWidth, containerWidth - state.leftWidth - 20);
                
                state.rightWidth = newRightWidth;
                state.isRightCollapsed = newRightWidth < 20;
            }

            updateDividers();
            updateAllWindows()
        }

        function onMouseUp() {
            divider.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function handleHorizontalResize(e) {
        e.preventDefault();
        horizontalDivider.classList.add('dragging');
    
        const startY = e.clientY;
        const initialTopHeight = rightTop.offsetHeight;
        const panelHeight = rightPanel.offsetHeight;
    
        function onMouseMove(e) {
            const deltaY = e.clientY - startY;
    
            let newTopHeight = Math.min(
                Math.max(0, initialTopHeight + deltaY), 
                panelHeight - 8
            );
    
            rightTop.style.height = `${newTopHeight}px`;
            rightBottom.style.height = `${panelHeight - newTopHeight}px`;
    
            horizontalDivider.style.top = `${newTopHeight}px`;
    
            state.isTopCollapsed = newTopHeight === 0; 
            state.isBottomCollapsed = (panelHeight - newTopHeight) === 0; 
        }
    
        function onMouseUp() {
            horizontalDivider.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
    
            rightTop.classList.toggle('collapsed', state.isTopCollapsed);
            rightBottom.classList.toggle('collapsed', state.isBottomCollapsed);
        }
    
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    
    
    

    leftDivider.addEventListener('mousedown', (e) => {
        handleVerticalResize(e, true);
    });

    rightDivider.addEventListener('mousedown', (e) => {
        handleVerticalResize(e, false);
    });

    horizontalDivider.addEventListener('mousedown', handleHorizontalResize);

    divisionSelect.addEventListener('change', updateWorkspaceDivisions);

    updateWorkspaceDivisions();
    updateDividers();
});