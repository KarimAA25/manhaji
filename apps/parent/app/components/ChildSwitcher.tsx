"use client";

/**
 * Sticky child switcher under the breadcrumb in the parent layout.
 *
 * "All children" pill on the left (household aggregate view). One pill per
 * child after that, each showing avatar + name + grade label + optional
 * alert badge.
 *
 * Single-child households still see the switcher, but only their child's
 * pill is shown (the "All children" pill is hidden).
 */

import {
  ALL_CHILDREN_ID, useActiveChild, type ChildId,
} from "@manhaj/lib/child";

export default function ChildSwitcher() {
  const { activeId, setActive, children } = useActiveChild();

  function pick(id: ChildId) {
    if (id === activeId) return;
    setActive(id);
  }

  const showAll = children.length > 1;

  return (
    <nav aria-label="Switch child" className="child-switcher">
      {showAll && (
        <button
          type="button"
          onClick={() => pick(ALL_CHILDREN_ID)}
          aria-current={activeId === ALL_CHILDREN_ID ? "true" : undefined}
          className={`child-tab aggregate ${activeId === ALL_CHILDREN_ID ? "active" : ""}`}
        >
          <span className="child-av" aria-hidden="true">⌂</span>
          <span className="child-meta">
            <span className="child-nm">All children</span>
            <span className="child-sub">household view</span>
          </span>
        </button>
      )}
      {children.map(c => (
        <button
          key={c.id}
          type="button"
          onClick={() => pick(c.id)}
          aria-current={activeId === c.id ? "true" : undefined}
          className={`child-tab ${activeId === c.id ? "active" : ""}`}
        >
          <span className="child-av" aria-hidden="true">{c.initial}</span>
          <span className="child-meta">
            <span className="child-nm">{c.full_name}</span>
            <span className="child-sub">{c.grade_label}</span>
          </span>
          {c.alert_count && c.alert_count > 0 && (
            <span className="child-badge" aria-label={`${c.alert_count} alerts`}>
              {c.alert_count} alert{c.alert_count === 1 ? "" : "s"}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
