import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AdminDetail } from "../../application/contracts";
import { OrderStatus } from "../../domain/models";
import { detailFields } from "./record-format";
@Component({
  selector: "app-record-detail",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./record-detail.component.html",
})
export class RecordDetailComponent {
  @Input() detail: AdminDetail | null = null;
  @Input() admin = false;
  @Input() busy = false;
  @Output() closed = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<OrderStatus>();
  get detailFields() {
    return detailFields(this.detail);
  }
}
