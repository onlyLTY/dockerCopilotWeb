import alipay from '@assets/alipay.jpg';
import wechat from '@assets/wechat.jpg';
import {Card} from "@components";
import './style.scss';

export default function About() {
    return (
        <div className="page !h-100vh">
            <Card className="about-card relative">
                <div className="about-content">
                    <div id="write" className="">
                        <p>
                    <span>一些个人的碎碎念。首先非常感谢大家自项目开始以来的使用、建议、鼓励和支持，然后要感谢绿联对本项目的支持。没有大家的这些反馈DC不会是今天的这个样子。他是属于我们共同的作品，我会继续尽力去维护好这个项目。如果在项目使用中遇到了bug或者想要提建议，可以在
                    </span><a
                            href="https://github.com/onlyLTY/dockerCopilot"><span>GitHub</span></a><span>的issue提出或者可以给我的邮箱onlylty@lty.wiki发送邮件。期待您的反馈。</span>
                        </p>
                        <p><span>最后的最后，如果您用的愉快的话，可以请我喝一瓶快乐水吗？</span></p>
                        <div className="about-img">
                            <div className="reward-img">
                                <div className="alipay">
                                    <img src={alipay} referrerPolicy="no-referrer" alt="支付宝"/>
                                    支付宝扫一扫
                                </div>
                                <div className="wechat">
                                    <img src={wechat} referrerPolicy="no-referrer" alt="微信"/>
                                    微信扫一扫
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}