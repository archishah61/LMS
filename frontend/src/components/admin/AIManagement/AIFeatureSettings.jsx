import React, { useState, useEffect } from 'react';
import { Card, InputNumber, Button, Typography, Space, Divider, Skeleton, Modal, Row, Col, Statistic, Badge, List, Alert } from 'antd';
import { SaveOutlined, SettingOutlined, RobotOutlined, CalculatorOutlined, BookOutlined, LineChartOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useGetFeatureSettingsAdminQuery, useUpdateFeatureSettingsMutation } from '../../../services/Ai/interviewAPI';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import PermissionWrapper from '../../../context/PermissionWrapper';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AdminLoader from '../AdminLoader';

const { Title, Text } = Typography;

// Feature configuration with updated colors using Tailwind config
const featureConfig = {
    interview: {
        name: 'AI Interview',
        icon: <RobotOutlined className="text-primary" />,
        description: 'Configure daily limit for AI interview sessions',
        color: 'primary',
        bgColor: 'bg-lightGreen',
        borderColor: 'border-leafGreen/30'
    },
    math_solver: {
        name: 'Math Solver',
        icon: <CalculatorOutlined className="text-primary" />,
        description: 'Configure daily limit for math problem solving',
        color: 'primary',
        bgColor: 'bg-lightGreen',
        borderColor: 'border-leafGreen/30'
    },
    course_generation: {
        name: 'Course Generation',
        icon: <BookOutlined className="text-primary" />,
        description: 'Configure daily limit for course generation',
        color: 'primary',
        bgColor: 'bg-lightGreen',
        borderColor: 'border-leafGreen/30'
    },
    learning_path: {
        name: 'Learning Path',
        icon: <LineChartOutlined className="text-primary" />,
        description: 'Configure daily limit for learning path creation',
        color: 'primary',
        bgColor: 'bg-lightGreen',
        borderColor: 'border-leafGreen/30'
    }
};

const InterviewSettings = () => {
    const { access_token } = useSelector((state) => state.auth);
    const { data: settingsData, isLoading, refetch } = useGetFeatureSettingsAdminQuery({ access_token });
    const [updateSettings, { isLoading: isUpdating }] = useUpdateFeatureSettingsMutation();
    const navigate = useNavigate();

    const [settings, setSettings] = useState({});
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [tempLimit, setTempLimit] = useState(null);

    useEffect(() => {
        if (settingsData?.success && settingsData.data) {
            const settingsObj = {};
            settingsData.data.forEach(item => {
                settingsObj[item.type] = {
                    limit: item.limit,
                    is_active: item.is_active,
                    id: item.id
                };
            });
            setSettings(settingsObj);
        }
    }, [settingsData]);

    const handleLimitChange = (value) => {
        setTempLimit(value);
    };

    const openModal = (type) => {
        const config = getFeatureStyle(type);
        setSelectedFeature({
            type,
            ...config,
            currentLimit: settings[type]?.limit
        });
        setTempLimit(settings[type]?.limit);
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!selectedFeature || tempLimit === null) return;

        try {
            await updateSettings({
                limit: tempLimit,
                type: selectedFeature.type,
                access_token
            }).unwrap();
            toast.success(`${selectedFeature.name} settings updated successfully`);
            setModalVisible(false);
            setSelectedFeature(null);
            setTempLimit(null);
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || 'Failed to update settings');
        }
    };

    const getFeatureStyle = (type) => {
        const config = featureConfig[type] || {
            name: type.replace(/_/g, ' ').toUpperCase(),
            icon: <SettingOutlined className="text-primary" />,
            description: `Configure daily limit for ${type.replace(/_/g, ' ')}`,
            color: 'primary',
            bgColor: 'bg-lightGreen',
            borderColor: 'border-leafGreen/30'
        };
        return config;
    };

    if (isLoading) {
        return <AdminLoader className="h-screen" message="Loading AI Feature Settings..." />;

        return (
            <div className="p-6">
                <Skeleton active />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 flex-shrink-0">
                <div className="w-full px-4 lg:px-6 py-3 lg:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 lg:flex-none lg:min-w-0">
                            <div className="text-center lg:text-left">
                                <h1 className="text-xl lg:text-2xl font-bold bg-forestGreen bg-clip-text text-transparent break-words">
                                    AI Features Settings
                                </h1>
                                <p className="text-gray-600 mt-0.5 lg:mt-1 text-xs lg:text-base hidden lg:block break-words">
                                    Configure global daily limits for all AI-powered features.
                                </p>
                            </div>
                        </div>

                        {/* Back button */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <button
                                onClick={() => navigate("/admin/dashboard")}
                                className="flex items-center justify-center w-10 h-10 lg:w-auto lg:h-auto lg:px-4 lg:py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap"
                            >
                                <ArrowLeft size={18} />
                                <span className="hidden lg:inline font-medium ml-2">Back</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content area with scrolling */}
            <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6">
                <div className="mx-auto space-y-6">
                    {/* List View */}
                    <Card className="border-leafGreen/30 shadow-sm">
                        <List
                            dataSource={Object.keys(settings)}
                            renderItem={(type) => {
                                const config = getFeatureStyle(type);
                                const currentSetting = settings[type];

                                return (
                                    <List.Item
                                        className="hover:bg-lightGreen/20 transition-all duration-300 px-4 py-6"
                                        actions={[
                                            <PermissionWrapper section="AI Interview Settings" action="edit" key="edit">
                                                <Button
                                                    type="primary"
                                                    icon={<EditOutlined />}
                                                    onClick={() => openModal(type)}
                                                    className="bg-leafGreen hover:bg-primary border-none shadow-sm"
                                                    style={{ backgroundColor: '#009D5C' }}
                                                >
                                                    Set Limit
                                                </Button>
                                            </PermissionWrapper>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <div className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}>
                                                    {config.icon}
                                                </div>
                                            }
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <Text strong className="text-forestGreen text-lg">
                                                        {config.name}
                                                    </Text>
                                                    <Badge
                                                        count={currentSetting?.limit}
                                                        showZero
                                                        style={{ backgroundColor: '#009D5C' }}
                                                    />
                                                </div>
                                            }
                                            description={
                                                <div className="space-y-1">
                                                    <Text type="secondary" className="text-darkSand">
                                                        {config.description}
                                                    </Text>
                                                    <div className="mt-2">
                                                        <Text className="text-forestGreen">
                                                            Current daily limit: <strong>{currentSetting?.limit || 0}</strong> per user
                                                        </Text>
                                                    </div>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                );
                            }}
                        />
                    </Card>

                    {/* Info Note */}
                    {/* <Alert
                        message="Important Information"
                        description={
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>Changes to daily limits will take effect immediately for all users</li>
                                <li>The limit is reset at midnight (00:00) every day based on the server's time zone</li>
                                <li>Each feature has its own independent daily limit counter</li>
                                <li>Users will be notified when they approach their daily limit</li>
                            </ul>
                        }
                        type="info"
                        icon={<InfoCircleOutlined />}
                        className="bg-lightGreen border-leafGreen/30 text-forestGreen"
                        showIcon
                    /> */}
                </div>
            </div>

            {/* Modal for setting limit */}
            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${selectedFeature?.bgColor} flex items-center justify-center`}>
                            {selectedFeature?.icon}
                        </div>
                        <span className="text-forestGreen font-semibold">
                            Set Daily Limit - {selectedFeature?.name}
                        </span>
                    </div>
                }
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setSelectedFeature(null);
                    setTempLimit(null);
                }}
                footer={[
                    <Button key="cancel" onClick={() => {
                        setModalVisible(false);
                        setSelectedFeature(null);
                        setTempLimit(null);
                    }}>
                        Cancel
                    </Button>,
                    <Button
                        key="save"
                        type="primary"
                        loading={isUpdating}
                        onClick={handleSave}
                        className="bg-leafGreen hover:bg-primary border-none"
                        style={{ backgroundColor: '#009D5C' }}
                    >
                        Save Changes
                    </Button>
                ]}
                width={500}
                className="settings-modal"
            >
                {selectedFeature && (
                    <div className="space-y-6">
                        {/* Limit Input */}
                        <div>
                            <Text strong className="block mb-2 text-forestGreen">
                                Update Daily Limit:
                            </Text>
                            <InputNumber
                                min={1}
                                max={100}
                                value={tempLimit}
                                onChange={handleLimitChange}
                                size="large"
                                style={{ width: '100%', maxWidth: '200px' }}
                                className="border-leafGreen/30 focus:border-primary rounded-lg"
                            />
                            <Text type="secondary" className="text-xs mt-2 block text-gray-600">
                                Enter a value between 1 and 100
                            </Text>
                        </div>

                        {/* Important Notes */}
                        <Divider className="border-leafGreen/20" />
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <InfoCircleOutlined className="text-primary" />
                                <Text strong className="text-forestGreen">Important Notes:</Text>
                            </div>
                            <ul className="list-disc pl-5 space-y-2 text-gray-600">
                                <li>Changes will take effect immediately</li>
                                <li>Limit resets daily at midnight (00:00)</li>
                                <li>Users will be notified when approaching limit</li>
                            </ul>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default InterviewSettings;