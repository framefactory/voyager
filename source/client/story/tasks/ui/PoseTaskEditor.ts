/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import CustomElement, { customElement, html, property } from "@ff/ui/CustomElement";
import PropertyTracker from "@ff/graph/PropertyTracker";
import "@ff/ui/Splitter";
import List from "@ff/ui/List";
import "@ff/ui/Button";
import "@ff/ui/IndexButton";

import ExplorerSystem, { IComponentEvent } from "../../../explorer/ExplorerSystem";

import Model from "../../../explorer/components/Model";

import PoseManip, { EManipMode } from "../../components/PoseManip";
import TaskEditor from "./TaskEditor";
import PoseTask from "../PoseTask";

import "../../ui/PropertyView";
import { IButtonClickEvent } from "@ff/ui/Button";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-pose-task-editor")
export default class PoseTaskEditor extends TaskEditor
{
    protected task: PoseTask;
    protected model: Model;

    protected system: ExplorerSystem;

    constructor(task: PoseTask)
    {
        super(task);

        this.system = task.system;
    }

    protected firstConnected()
    {
        super.firstConnected();

        this.setStyle({
            display: "flex",
            flexDirection: "column"
        });
    }

    protected connected()
    {
        super.connected();
        this.system.selection.components.on<IComponentEvent>("component", this.onControllerSelect, this);
        this.model = this.system.selection.components.get(Model);
    }

    protected disconnected()
    {
        super.disconnected();
        this.system.selection.components.off<IComponentEvent>("component", this.onControllerSelect, this);
        this.model = null;
    }

    protected render()
    {
        const system = this.task.system;
        const model = this.model;

        return html`
            <div class="sv-section" style="flex: 1 1 25%">
                <sv-model-list .system=${system}></sv-model-list>
            </div>
            <ff-splitter direction="vertical"></ff-splitter>
            <div class="sv-section" style="flex: 1 1 75%">
                <sv-model-pose-properties .system=${system} .model=${model}></sv-model-pose-properties>
            </div>
        `;
    }

    protected onControllerSelect(event: IComponentEvent)
    {
        if (event.component instanceof Model) {
            if (event.add) {
                this.model = event.component;
            }
            else if (event.component === this.model) {
                this.model = null;
            }

            this.requestUpdate();
        }
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-model-list")
class ModelList extends List<Model>
{
    @property({ attribute: false })
    system: ExplorerSystem;

    constructor(system?: ExplorerSystem)
    {
        super();
        this.system = system;
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-scrollable");

        if (!this.system) {
            throw new Error("missing system");
        }
    }

    protected connected()
    {
        super.connected();
        this.system.selection.components.on<IComponentEvent>("component", this.onSelectComponent, this);
        this.system.components.on<IComponentEvent>("component", this.onUpdateComponents, this);
    }

    protected disconnected()
    {
        super.disconnected();
        this.system.selection.components.off<IComponentEvent>("component", this.onSelectComponent, this);
        this.system.components.off<IComponentEvent>("component", this.onUpdateComponents, this);
    }

    protected render()
    {
        this.data = this.system.components.getArray(Model);
        return super.render();
    }

    protected renderItem(model: Model)
    {
        return model.node.name || model.node.type;
    }

    protected isItemSelected(item: Model): boolean
    {
        return this.system.selection.components.contains(item);
    }

    protected onSelectComponent(event: IComponentEvent)
    {
        if (event.component instanceof Model) {
            this.setSelected(event.component, event.add);
        }
    }

    protected onUpdateComponents(event: IComponentEvent)
    {
        this.requestUpdate();
    }

    onClickItem(event: MouseEvent, model: Model)
    {
        this.system.selection.selectComponent(model, event.ctrlKey);
    }

    protected onClickEmpty(event: MouseEvent)
    {
        if (this.system.selection.components.has(Model)) {
            this.system.selection.clearSelection();
        }
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-model-pose-properties")
class ModelPoseProperties extends CustomElement
{
    @property({ attribute: false })
    system: ExplorerSystem;

    @property({ attribute: false })
    model: Model;

    protected modeProp: PropertyTracker<EManipMode>;
    protected centerProp: PropertyTracker;


    constructor(model?: Model)
    {
        super();

        this.model = model;
        this.modeProp = new PropertyTracker(this.onPropertyUpdate, this);
        this.centerProp = new PropertyTracker(this.onPropertyUpdate, this);
    }

    protected connected()
    {
        this.modeProp.attachInput(this.system, PoseManip, "Mode");
        this.centerProp.attachInput(this.system, PoseManip, "Center");
    }

    protected disconnected()
    {
        this.modeProp.detach();
        this.centerProp.detach();
    }

    protected render()
    {
        const model = this.model;
        if (!model) {
            return html``;
        }

        const mode = this.modeProp.getValue(EManipMode.Rotate);
        const units = model.ins.units;
        const position = model.ins.position;
        const rotation = model.ins.rotation;

        return html`
            <ff-flex-row>
                <ff-index-button text="Move" index=${EManipMode.Translate} selectedIndex=${mode} @click=${this.onClickMode}></ff-index-button>
                <ff-index-button text="Rotate" index=${EManipMode.Rotate} selectedIndex=${mode} @click=${this.onClickMode}></ff-index-button>
                <ff-button text="Center" @click=${this.onClickCenter}></ff-button>
            </ff-flex-row>
                
            <sv-property-view .property=${units}></sv-property-view>
            <sv-property-view .property=${position}></sv-property-view>
            <sv-property-view .property=${rotation}></sv-property-view>
        `;
    }

    protected onClickMode(event: IButtonClickEvent)
    {
        this.modeProp.setValue(event.target.index);
    }

    protected onClickCenter()
    {
        this.centerProp.set();
    }

    protected onPropertyUpdate()
    {
        this.requestUpdate();
    }
}