import SVG from "react-inlinesvg";
import styled from "styled-components";
import React, { useState, useCallback } from "react";

const BadSource = styled.div`
	width: 100%;
	height: 100%;
	border-radius: 300px;
	background-color: ${({ theme }) => theme.text1};
	display: flex;
	align-items: center;
	justify-content: center;
`;

const Img = ({ src, alt, ...props }) => {
	const [tries, refresh] = useState(0);

	const errorHandler = useCallback(() => {
		refresh(-1);
	}, []);

	if (tries > -1 && src) {
		return <img {...props} src={src} alt={alt} onError={errorHandler} />;
	}

	return (
		<BadSource {...props}>
			<SVG src={require("../../../assets/images/question-mark.svg").default} />
		</BadSource>
	);
};

export default Img;
