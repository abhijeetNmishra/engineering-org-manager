import React, { useEffect, useMemo } from 'react';
import { Form, Input, Select, InputNumber, Button, Space, Divider, AutoComplete } from 'antd';
import { motion } from 'framer-motion';
import { useOrgStore } from '../../state/orgStore';
import type { Employee, RoleLevel, LocationTag, TechnicalSkill, EmployeeStatus } from '../../domain/types';

interface EmployeeFormProps {
    initialValues?: Employee;
    onSubmit: (values: Employee) => void;
    onCancel: () => void;
    loading?: boolean;
}

const ROLE_OPTIONS: RoleLevel[] = [
    "VP", "Director", "Senior Principal Engineer", "Principal Engineer",
    "Senior Engineering Manager", "Engineering Manager",
    "Staff Engineer", "Senior Engineer", "Engineer", "Associate Engineer"
];

const LOCATION_OPTIONS: LocationTag[] = ["US", "Nearshore", "Offshore"];
const STATUS_OPTIONS: EmployeeStatus[] = ["active", "on_leave", "open"];

const SKILL_OPTIONS: TechnicalSkill[] = [
    "Frontend - Web", "Frontend - App", "Backend", "Fullstack", "AI/ML",
    "DevOps/SRE", "Architecture", "GraphQL", "API Design", "Backend - Search"
];

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
    initialValues,
    onSubmit,
    onCancel,
    loading
}) => {
    const [form] = Form.useForm();
    const { state } = useOrgStore();

    // Reset form when initialValues change
    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
        } else {
            form.resetFields();
        }
    }, [initialValues, form]);

    const managerOptions = useMemo(() => {
        return state.employees
            .filter(e => e.id !== initialValues?.id) // Prevent self-reporting
            .map(e => ({ label: `${e.name} (${e.title})`, value: e.id }));
    }, [state.employees, initialValues?.id]);

    // Dynamic Role Options: Defaults + Any new ones used by existing employees
    const roleOptions = useMemo(() => {
        const uniqueRoles = new Set(ROLE_OPTIONS);
        state.employees.forEach(e => {
            if (e.title) uniqueRoles.add(e.title);
        });
        return Array.from(uniqueRoles).sort().map(r => ({ value: r }));
    }, [state.employees]);

    // Dynamic Skill Options: Defaults + Any new ones used by existing employees
    const skillOptions = useMemo(() => {
        const uniqueSkills = new Set(SKILL_OPTIONS);
        state.employees.forEach(e => {
            if (e.primarySkill) uniqueSkills.add(e.primarySkill);
            if (e.secondarySkills) {
                e.secondarySkills.forEach(s => uniqueSkills.add(s));
            }
        });
        return Array.from(uniqueSkills).sort().map(s => ({ value: s }));
    }, [state.employees]);

    const handleSubmit = (values: any) => {
        // If editing, preserve ID. If new, use email as ID (or generate one)
        const id = initialValues?.id || values.email;

        const employee: Employee = {
            ...values,
            id,
            module_ids: values.moduleOwnershipIds || [], // Use the selected submodules
        };
        onSubmit(employee);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={initialValues}
                requiredMark="optional"
            >
                <Form.Item
                    name="name"
                    label="Full Name"
                    rules={[{ required: true, message: 'Please enter a name' }]}
                >
                    <Input placeholder="Jane Doe" />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="Email (ID)"
                    rules={[
                        { required: true, message: 'Please enter an email' },
                        { type: 'email', message: 'Please enter a valid email' }
                    ]}
                    help={initialValues ? "ID cannot be changed" : "Email will be used as the unique ID"}
                >
                    <Input placeholder="jane.doe@shipt.com" disabled={!!initialValues} />
                </Form.Item>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Form.Item
                        name="title"
                        label="Role / Title"
                        rules={[{ required: true, message: 'Please enter or select a role' }]}
                    >
                        <AutoComplete
                            placeholder="Select or type role"
                            options={roleOptions}
                            filterOption={(inputValue, option) =>
                                option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Status"
                        initialValue="active"
                    >
                        <Select options={STATUS_OPTIONS.map(s => ({ label: s.replace('_', ' ').toUpperCase(), value: s }))} />
                    </Form.Item>
                </div>

                <Form.Item
                    name="managerId"
                    label="Reports To"
                >
                    <Select
                        showSearch
                        placeholder="Select manager"
                        options={managerOptions}
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        allowClear
                    />
                </Form.Item>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Form.Item
                        name="location"
                        label="Location"
                        initialValue="US"
                    >
                        <Select options={LOCATION_OPTIONS.map(l => ({ label: l, value: l }))} />
                    </Form.Item>

                    <Form.Item
                        name="tenure"
                        label="Tenure (months)"
                    >
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                </div>

                <Divider>Skills & Assignment</Divider>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Form.Item
                        name="primarySkill"
                        label="Primary Skill"
                        rules={[{ required: true, message: 'Primary skill is required' }]}
                    >
                        <AutoComplete
                            placeholder="Select or type primary skill"
                            options={skillOptions}
                            filterOption={(inputValue, option) =>
                                option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        shouldUpdate={(prev, curr) => prev.primarySkill !== curr.primarySkill}
                    >
                        {({ getFieldValue }) => {
                            const primarySkill = getFieldValue('primarySkill');
                            const filteredOptions = skillOptions.filter(o => o.value !== primarySkill);

                            return (
                                <Form.Item
                                    name="secondarySkills"
                                    label="Secondary Skills"
                                >
                                    <Select
                                        mode="multiple"
                                        placeholder="Select secondary skills"
                                        options={filteredOptions}
                                        disabled={!primarySkill}
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>
                </div>

                <Form.Item
                    name="workstreams"
                    label="Workstreams"
                    rules={[{ required: true, message: 'Please select at least one workstream' }]}
                >
                    <Select
                        mode="multiple"
                        placeholder="Select workstreams"
                        options={state.modules
                            .filter(m => !m.parentId) // Only Root Modules are Workstreams
                            .map(m => ({ label: m.name, value: m.name })) // Use Name as key based on current data model
                        }
                        onChange={(selectedWorkstreams: string[]) => {
                            // Reset submodules that don't belong to selected workstreams
                            const currentSubmodules = form.getFieldValue('moduleOwnershipIds') || [];
                            const validSubmodules = state.modules
                                .filter(m => m.parentId && selectedWorkstreams.includes(m.workstream))
                                .map(m => m.id);

                            const newSubmodules = currentSubmodules.filter((id: string) => validSubmodules.includes(id));
                            form.setFieldsValue({ moduleOwnershipIds: newSubmodules });
                        }}
                    />
                </Form.Item>

                <Form.Item
                    shouldUpdate={(prev, curr) => prev.workstreams !== curr.workstreams}
                >
                    {({ getFieldValue }) => {
                        const selectedWorkstreams = getFieldValue('workstreams') || [];
                        const isEnabled = selectedWorkstreams.length > 0;

                        const availableSubmodules = state.modules
                            .filter(m => m.parentId && selectedWorkstreams.includes(m.workstream))
                            .map(m => ({
                                label: `${m.name} (${m.workstream})`,
                                value: m.id
                            }));

                        return (
                            <Form.Item
                                name="moduleOwnershipIds"
                                label="Submodules (Owned/Co-owned)"
                                help={!isEnabled ? "Select a workstream first" : "Select specific modules this person owns"}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder={isEnabled ? "Select submodules" : "Disabled"}
                                    disabled={!isEnabled}
                                    options={availableSubmodules}
                                    optionFilterProp="label"
                                />
                            </Form.Item>
                        );
                    }}
                </Form.Item>

                <Form.Item>
                    <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={onCancel}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {initialValues ? 'Update Employee' : 'Add Employee'}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </motion.div>
    );
};
