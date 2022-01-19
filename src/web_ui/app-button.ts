import { css, html, LitElement, TemplateResult } from "lit";
import {customElement, property} from "lit/decorators.js";

@customElement('app-button')
export class AppButton extends LitElement {
    @property({type: String, reflect: true}) text = 'default';
    @property({type: Object}) icon:TemplateResult|null = null;
    @property({type: Boolean}) primary:boolean = false;
    @property({type: Boolean}) disabled:boolean = false;

    static override styles = css`
        :host {
            position: relative;
            width: fit-content;
            height: fit-content;
        }
        :host([disabled]) {
            opacity: .4;
        }
        button {
            border: 2px solid #383838;
            font-family: 'Ubuntu';
            background: #E5E5E5;
            border-radius: 4px;
            padding: 6px 16px 6px 6px;
            color: #383838;
            font-weight: bold;
            position: relative;
            cursor: pointer;
            z-index: 1;
            display: flex;
            align-items: center;
        }
        button svg {
            width: 16px;
            height: 16px;
            fill: #383838;
            margin-right: 8px;
        }
        :host(:not([disabled])) button:hover {
            transform: translate(-1px, -1px);
        }
        :host(:not([disabled])) button:active {
            transform: translate(1px, 1px);
        }
        .shadow {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 100%;
            height: 100%;
            border-radius: 4px;
            background: #383838;
        }
        :host([primary]) button {
            border: 2px solid #767676;
            background: #767676;
            color: white;
        }
        :host([primary]) button svg {
            fill: white;
        }
        :host([primary]) .shadow {
            width: calc(100% + 1px);
            height: calc(100% + 1px);
            background: #383838;
        }
    `;

    render() {
      return html`
        <div class="shadow"></div>
        <button>
            ${this.icon ?? ''}
            ${this.text}
        </button>
      `;
    }
  }