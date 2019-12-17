// *******************************************
// Property Inspector Extension
// *******************************************
function PropertyInspectorExtension(viewer, options) {
    Autodesk.Viewing.Extension.call(this, viewer, options);
    this.panel = null;
}

PropertyInspectorExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
PropertyInspectorExtension.prototype.constructor = PropertyInspectorExtension;

PropertyInspectorExtension.prototype.load = function () {
    if (this.viewer.toolbar) {
        // Toolbar is already available, create the UI
        this.createUI();
    } else {
        // Toolbar hasn't been created yet, wait until we get notification of its creation
        this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
        this.viewer.addEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    }
    return true;
};

PropertyInspectorExtension.prototype.onToolbarCreated = function () {
    this.viewer.removeEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    this.onToolbarCreatedBinded = null;
    this.createUI();
};

PropertyInspectorExtension.prototype.createUI = function () {
    var viewer = this.viewer;
    var panel = this.panel;

    // button to show the docking panel
    var toolbarButtonShowDockingPanel = new Autodesk.Viewing.UI.Button('showPropertyInspectorPanel');
    toolbarButtonShowDockingPanel.icon.classList.add("adsk-icon-properties");
    toolbarButtonShowDockingPanel.container.style.color = "orange";
    toolbarButtonShowDockingPanel.onClick = function (e) {
        // if null, create it
        if (panel == null) {
            panel = new PropertyInspectorPanel(viewer, viewer.container, 'AllPropertiesPanel', 'All Properties');
            panel.showProperties(viewer.model.getRootId());
        }
        // show/hide docking panel
        panel.setVisible(!panel.isVisible());
    };
    
    toolbarButtonShowDockingPanel.addClass('propertyInspectorToolbarButton');
    toolbarButtonShowDockingPanel.setToolTip('Property Inspector Panel');

    // SubToolbar
    this.subToolbar = new Autodesk.Viewing.UI.ControlGroup('PropertyInspectorToolbar');
    this.subToolbar.addControl(toolbarButtonShowDockingPanel);

    viewer.toolbar.addControl(this.subToolbar);
};

PropertyInspectorExtension.prototype.unload = function () {
    this.viewer.toolbar.removeControl(this.subToolbar);
    return true;
};

Autodesk.Viewing.theExtensionManager.registerExtension('PropertyInspectorExtension', PropertyInspectorExtension);

// *******************************************
// Property Inspector Extension
// *******************************************

function PropertyInspectorPanel (viewer, container, id, title, options) {
    this.viewer = viewer;
    this.breadcrumbsItems = [];
    Autodesk.Viewing.UI.PropertyPanel.call(this, container, id, title, options);

    this.showBreadcrumbs = function () {
        // Create it if not there yet
        if (!this.breadcrumbs) {
            this.breadcrumbs = document.createElement('span');   
            this.title.appendChild(this.breadcrumbs);
        } else {
            while (this.breadcrumbs.firstChild) {
                this.breadcrumbs.removeChild(this.breadcrumbs.firstChild);
            }
        }

        // Fill it with items
        this.breadcrumbs.appendChild(document.createTextNode(' ['));
        this.breadcrumbsItems.forEach(dbId => {
            if (this.breadcrumbs.children.length > 0) {
                var text = document.createTextNode(' > ');
                this.breadcrumbs.appendChild(text);
            }
            
            var item = document.createElement('a');
            item.innerText = dbId;
            item.style.cursor = "pointer";
            item.onclick = this.onBreadcrumbClick.bind(this);
            this.breadcrumbs.appendChild(item);
        });
        this.breadcrumbs.appendChild(document.createTextNode(']'));
    }; // showBreadcrumbs

    this.showProperties = function (dbId) {
        this.removeAllProperties();

        var that = this;
        this.viewer.getProperties(dbId, props => {
            props.properties.forEach(prop => {
                that.addProperty(
                    prop.displayName + ((prop.type === 11) ? "[dbId]" : ""),
                    prop.displayValue,
                    prop.displayCategory
                );
            });
        });

        this.breadcrumbsItems.push(dbId);
        this.showBreadcrumbs();
    }; // showProperties

    this.onBreadcrumbClick = function (event) {
        var dbId = parseInt(event.currentTarget.text);
        var index = this.breadcrumbsItems.indexOf(dbId)
        this.breadcrumbsItems = this.breadcrumbsItems.splice(0, index);

        this.showProperties(dbId);
    }; // onBreadcrumbClicked

    // This is overriding the default property click handler
    // of Autodesk.Viewing.UI.PropertyPanel
    this.onPropertyClick = function (property) {
        if (!property.name.includes("[dbId]")) {
            return;
        }

        var dbId = property.value;
        this.showProperties(dbId);
    }; // onPropertyClick

    this.onSelectionChanged = function (event) {
        var dbId = event.dbIdArray[0];

        if (!dbId) {
            dbId = this.viewer.model.getRootId();
        }

        this.breadcrumbsItems = [];   
        this.showProperties(dbId);
    } // onSelectionChanged

    viewer.addEventListener(
        Autodesk.Viewing.SELECTION_CHANGED_EVENT, 
        this.onSelectionChanged.bind(this)
    );
}; // PropertyInspectorPanel
PropertyInspectorPanel.prototype = Object.create(Autodesk.Viewing.UI.PropertyPanel.prototype);
PropertyInspectorPanel.prototype.constructor = PropertyInspectorPanel;