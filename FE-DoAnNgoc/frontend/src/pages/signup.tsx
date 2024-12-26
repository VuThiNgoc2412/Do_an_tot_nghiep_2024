import { Button, Card, Form, Input, message, Space, Typography } from "antd";
import { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import handleAPI from "../apis/handleAPI";
import { addAuth } from "../redux/reducers/authReducer";
import { useDispatch } from "react-redux";

const { Title, Text } = Typography;

const SignUp = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSignUp = async (values: {
    name: string;
    email: string;
    password: string;
  }) => {
    setIsLoading(true);

    try {
      const res: any = await handleAPI("/auth/signup", values, "post");
      message.success(res.data.message);
      dispatch(addAuth(res.data.data));
      navigate("/");
    } catch (error: any) {
      toast.error(error.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col d-none d-lg-block text-center">
          <img
            style={{
              width: 256,
              objectFit: "cover",
              marginTop: "28%",
            }}
            src="https://firebasestorage.googleapis.com/v0/b/kanban-c0323.appspot.com/o/kanban-logo.png?alt=media&token=a3e8c386-57da-49a3-b9a2-94b8fd93ff83"
            alt=""
          />
          <div>
            <Title className="text-primary">IMS</Title>
          </div>
        </div>

        <div className="col">
          <Card
            style={{
              width: "65%",
              marginLeft: "10%",
              marginTop: "13%",
            }}
          >
            <div className="text-center">
              <img
                className="mb-3"
                src="https://firebasestorage.googleapis.com/v0/b/kanban-c0323.appspot.com/o/kanban-logo.png?alt=media&token=a3e8c386-57da-49a3-b9a2-94b8fd93ff83"
                alt=""
                style={{
                  width: 48,
                  height: 48,
                }}
              />
              <Title level={2}>Sign Up to your account</Title>
            </div>

            <Form
              layout="vertical"
              form={form}
              onFinish={handleSignUp}
              disabled={isLoading}
              size="large"
            >
              <Form.Item
                name={"name"}
                label="Name"
                rules={[
                  {
                    required: true,
                    message: "Please enter your name!!!",
                  },
                ]}
              >
                <Input allowClear maxLength={100} type="text" />
              </Form.Item>

              <Form.Item
                name={"email"}
                label="Email"
                rules={[
                  {
                    required: true,
                    message: "Please enter your email!!!",
                  },
                ]}
              >
                <Input allowClear maxLength={100} type="text" />
              </Form.Item>

              <Form.Item
                name={"password"}
                label="Password"
                rules={[
                  {
                    required: true,
                    message: "Please enter your password!!!",
                  },
                ]}
              >
                <Input.Password maxLength={100} type="email" />
              </Form.Item>
            </Form>

            <div className="row">
              <div className="col text-end">
                <Link to={"/forgot-password"}>Forgot password?</Link>
              </div>
            </div>

            <div className="mt-4 mb-3">
              <Button
                loading={isLoading}
                onClick={() => form.submit()}
                type="primary"
                style={{
                  width: "100%",
                }}
                size="large"
              >
                Sign Up
              </Button>
            </div>
            <div className="mt-3 text-center">
              <Space>
                <Text>Account already ? </Text>
                <Link to={"/login"}>Login</Link>
              </Space>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
