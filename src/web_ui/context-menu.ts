import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Vector } from "../vector";
import { ADD_CIRCLE_ICON, DELETE_ALL_ICON, DELETE_ICON } from "./icons";

interface MenuItem {
    icon?: TemplateResult;
    label: string;
    id: string;
}

@customElement('context-menu')
export class ContextMenu extends LitElement {
    @property({type: String, reflect: true}) shown:'true'|'false' = 'false';
    @property({type: String, reflect: true}) items:MenuItem[] = [];
    static override styles = css`
        :host {
            position: absolute;
            display: none;
            z-index: 0;
        }
        :host([shown="true"]) {
            display: block;
        }
        .context-menu {
            width: 224px;
            padding: 8px 0px;
            background: white;
            border-radius: 8px;
            border: 1px solid #383838;
            font-family: 'Ubuntu';
            position: relative;
        }

        .context-menu::before {
            content: '';
            width: 100%;
            height: 100%;
            background: #383838;
            position: absolute;
            top: var(--shadow-offset, 6px);
            left: var(--shadow-offset, 6px);
            border-radius: 8px;
            z-index: -1;
        }

        .context-menu .menu-item {
            border: none;
            background: transparent;
            width: 100%;
            font-size: 14px;
            box-sizing: border-box;
            padding: 8px 16px;
            color: #383838;
            cursor: pointer;
            text-align: left;
            display: flex;
            align-items: center;
            justify-content: flex-start;
        }

        .context-menu .menu-item svg {
            width: 16px;
            height: 16px;
            padding-right: 12px;
            fill: #383838;
        }

        .context-menu .menu-item:hover {
            background: rgba(0, 0, 0, 0.07);
        }
    `;

    show(position: Vector, items: MenuItem[]) {
        this.items = items;
        this.style.top = position.y + 'px';
        this.style.left = position.x + 'px';
        this.shown = 'true';
    }

    hide() {
        this.shown = 'false';
    }

    makeSelection(selection: string) {
        this.dispatchEvent(new CustomEvent('context-menu-selection', {
            detail: selection,
            bubbles: true,
            composed: true
        }));
        this.hide();
    }

    render() {
      return html`
        <div class="context-menu">
            ${this.items.map(item => html`
            <button @click=${() => this.makeSelection(item.id)} class="menu-item">
                ${item.icon}
                ${item.label}
            </button>
            `)}
        </div>
      `;
    }
  }