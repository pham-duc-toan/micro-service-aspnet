import { Copy, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react'
import { Table } from '../../components/Table'
import { SelectField } from '../../components/Field'
import { ADMIN_ROLE_ID, PERMISSION_COMMANDS, PRODUCT_FUNCTIONS } from '../../storefront/constants'
import { useStorefront } from '../../storefront/StorefrontContext'

export function StudioAccessPage() {
  const {
    permissions,
    roleId,
    setRoleId,
    permissionForm,
    setPermissionForm,
    loadPermissions,
    addPermission,
    deletePermission,
    syncPermissions,
  } = useStorefront()

  return (
    <div className="pageStack">
      <section className="band">
        <div className="sectionHeader">
          <div>
            <h2>Access</h2>
            <p>Manage the role permission matrix that guards merchant operations.</p>
          </div>
        </div>

        <div className="splitView">
          <div className="pane">
            <div className="formGrid">
              <SelectField label="Role id" value={roleId} onChange={setRoleId} options={[[ADMIN_ROLE_ID, ADMIN_ROLE_ID]]} />
              <SelectField label="Function" value={permissionForm.function} onChange={(value) => setPermissionForm((current) => ({ ...current, function: value }))} options={PRODUCT_FUNCTIONS.map((value) => [value, value])} />
              <SelectField label="Command" value={permissionForm.command} onChange={(value) => setPermissionForm((current) => ({ ...current, command: value }))} options={PERMISSION_COMMANDS.map((value) => [value, value])} />
            </div>

            <div className="stackButtons">
              <button type="button" className="ghostButton" onClick={() => loadPermissions(roleId)}>
                <ShieldCheck size={16} />
                <span>Load</span>
              </button>
              <button type="button" className="primaryButton" onClick={addPermission}>
                <Copy size={16} />
                <span>Add</span>
              </button>
              <button type="button" className="secondaryButton" onClick={syncPermissions}>
                <RefreshCcw size={16} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          <div className="pane">
            <Table
              rows={permissions}
              empty="No permissions loaded"
              columns={[
                { key: 'function', label: 'Function' },
                { key: 'command', label: 'Command' },
                {
                  key: 'actions',
                  label: '',
                  render: (row) => (
                    <div className="tableActions">
                      <button type="button" className="iconButton danger" onClick={() => deletePermission(row)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

